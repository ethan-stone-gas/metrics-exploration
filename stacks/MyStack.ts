import { StackContext, Function } from "sst/constructs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import {
  CaCertificate,
  DatabaseInstance,
  DatabaseInstanceEngine,
  NetworkType,
  PostgresEngineVersion,
  SubnetGroup,
} from "aws-cdk-lib/aws-rds";
import { Key } from "aws-cdk-lib/aws-kms";
import { Duration, RemovalPolicy } from "aws-cdk-lib/core";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

export function MetricsStack({ stack }: StackContext) {
  const vpc = new Vpc(stack, "VPC", {
    maxAzs: 2,
    subnetConfiguration: [
      {
        name: `Metrics-Private-NAT`,
        cidrMask: 20,
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      {
        name: `Metrics-Public`,
        cidrMask: 20,
        subnetType: SubnetType.PUBLIC,
        mapPublicIpOnLaunch: false,
      },
    ],
    restrictDefaultSecurityGroup: true,
  });

  const port = 5432;
  const dbInstanceSecurityGroup = new SecurityGroup(stack, "PgsqlSg", {
    vpc,
    allowAllOutbound: false,
    description: `Allow port ${port} access to RDS from only within VPC ${vpc.vpcId}`,
  });

  dbInstanceSecurityGroup.addIngressRule(
    Peer.anyIpv4(),
    Port.tcp(port),
    `Allow port ${port} for database connection from only within the VPC (${vpc.vpcId})`
  );

  const encryptionKey = new Key(stack, "DbCredentialEncryptionKey", {
    removalPolicy: RemovalPolicy.DESTROY,
    enableKeyRotation: true,
    alias: "lynkwell/rds/metric/DbCredentialEncryptionKey",
  });
  const dbMasterUserName = "metric_admin";

  const db = new DatabaseInstance(stack, "PgsqlDatabase", {
    credentials: {
      username: dbMasterUserName,
      encryptionKey,
      secretName: "metric_admin",
    },
    iamAuthentication: true,
    vpcSubnets: {
      subnetType: SubnetType.PUBLIC,
    },
    deletionProtection: true,
    copyTagsToSnapshot: true,
    cloudwatchLogsExports: ["postgresql", "upgrade"],
    vpc,
    caCertificate: CaCertificate.RDS_CA_ECC384_G1,
    engine: DatabaseInstanceEngine.postgres({
      version: PostgresEngineVersion.VER_16_1,
    }),
    monitoringInterval: Duration.seconds(30),
    securityGroups: [dbInstanceSecurityGroup],
    cloudwatchLogsRetention: RetentionDays.THREE_MONTHS,
    networkType: NetworkType.IPV4,
    storageEncrypted: true,
    allocatedStorage: 200,
    backupRetention: Duration.days(7),
    databaseName: "metric",
    enablePerformanceInsights: true,
    instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM),
    maxAllocatedStorage: 200,
    publiclyAccessible: false,
    deleteAutomatedBackups: true,
    multiAz: true,
    storageEncryptionKey: new Key(stack, "DbStorageEncryptionKey", {
      removalPolicy: RemovalPolicy.DESTROY,
      enableKeyRotation: true,
      alias: "lynkwell/rds/metric/DbStorageEncryptionKey",
    }),
    subnetGroup: new SubnetGroup(stack, "DbSubnetGroup", {
      vpc,
      description: "This instance should live inside private subnets",
      removalPolicy: RemovalPolicy.DESTROY,
      subnetGroupName: "MetricDbSubnetGroup",
      vpcSubnets: vpc.selectSubnets({
        onePerAz: true,
        subnetType: SubnetType.PUBLIC,
      }),
    }),
  });

  const ingester = new Function(stack, "HandleSessionCUD", {
    handler: "packages/functions/src/consumers/handleSessionCUD.main",
    timeout: "15 minutes",
    initialPolicy: [
      new iam.PolicyStatement({
        actions: ["glue:GetSchemaVersion"],
        resources: ["*"],
      }),
    ],
    environment: {
      METRICS_SECRET_ARN: db.secret?.secretArn as string,
    },
  });

  db.secret?.grantRead(ingester);

  stack.addOutputs({});
}

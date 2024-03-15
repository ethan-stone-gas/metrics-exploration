import { StackContext, Function } from "sst/constructs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";

export function RedshiftStack({ stack }: StackContext) {
  const redshiftSecret = secretsmanager.Secret.fromSecretNameV2(
    stack,
    "RedshiftSecret",
    "redshift"
  );

  const managedRedShiftFullAccessPolicy =
    iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonRedshiftDataFullAccess");

  const ingester = new Function(stack, "Ingester", {
    handler: "packages/functions/src/lambda.handler",
    environment: {
      REDSHIFT_SECRET_ARN: redshiftSecret.secretArn,
    },
  });

  ingester.role?.addManagedPolicy(managedRedShiftFullAccessPolicy);

  redshiftSecret.grantRead(ingester);

  stack.addOutputs({});
}

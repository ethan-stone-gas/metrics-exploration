import {
  ExecuteStatementCommand,
  RedshiftDataClient,
} from "@aws-sdk/client-redshift-data";

const redshiftSecretArn = process.env.REDSHIFT_SECRET_ARN!;

const redShiftClient = new RedshiftDataClient({
  region: "us-east-1",
});

export const handler = async () => {
  const executeStatementCommand = new ExecuteStatementCommand({
    Database: "dev",
    SecretArn: redshiftSecretArn,
    WorkgroupName: "my-workgroup",
    Sql: `create table users(
userid integer not null distkey sortkey,
username char(8),
firstname varchar(30),
lastname varchar(30),
city varchar(30),
state char(2),
email varchar(100),
phone char(14),
likesports boolean,
liketheatre boolean,
likeconcerts boolean,
likejazz boolean,
likeclassical boolean,
likeopera boolean,
likerock boolean,
likevegas boolean,
likebroadway boolean,
likemusicals boolean);     `,
  });

  await redShiftClient.send(executeStatementCommand);

  return null;
};

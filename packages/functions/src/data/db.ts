import {
  DescribeStatementCommand,
  ExecuteStatementCommand,
  RedshiftDataClient,
} from "@aws-sdk/client-redshift-data";

export const redShiftSecretArn = process.env.REDSHIFT_SECRET_ARN!;

export const redShiftClient = new RedshiftDataClient({
  region: "us-east-1",
});

export async function executeStatement(query: string) {
  const res = await redShiftClient.send(
    new ExecuteStatementCommand({
      Database: "dev",
      SecretArn: redShiftSecretArn,
      Sql: query,
      WorkgroupName: "default-workgroup",
    })
  );

  while (true) {
    const statementDesc = await redShiftClient.send(
      new DescribeStatementCommand({
        Id: res.Id!,
      })
    );

    if (
      statementDesc.Status &&
      ["FINISHED", "ABORTED", "FAILED"].includes(statementDesc.Status)
    ) {
      console.log(
        "Statement duration in milliseconds: ",
        statementDesc.Duration! / 1000 / 1000
      );
      break;
    }
  }
}

export function formatDateToTimestamp(date: Date) {
  const year = date.getFullYear();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

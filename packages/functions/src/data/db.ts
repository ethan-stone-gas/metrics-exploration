import {
  DescribeStatementCommand,
  ExecuteStatementCommand,
  GetStatementResultCommand,
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

  let hasResultSet = false;

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
        "Statement duration in milliseconds:",
        statementDesc.Duration! / 1000 / 1000
      );
      hasResultSet = statementDesc.HasResultSet!;
      break;
    }
  }

  if (hasResultSet) {
    const resultSet = await redShiftClient.send(
      new GetStatementResultCommand({
        Id: res.Id!,
      })
    );

    return resultSet.Records;
  }

  return null;
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

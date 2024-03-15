import {
  DescribeStatementCommand,
  ExecuteStatementCommand,
  GetStatementResultCommand,
} from "@aws-sdk/client-redshift-data";
import { redShiftClient, redShiftSecretArn } from "./redshift-data-api";

export async function insertManyRedshiftChargingStations(
  chargingstation: RedshiftChargingStation[]
) {
  const query = buildInsertManyChargingStationStatement(chargingstation);

  const res = await redShiftClient.send(
    new ExecuteStatementCommand({
      Database: "dev",
      SecretArn: redShiftSecretArn,
      WorkgroupName: "default-workgroup",
      Sql: query,
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
        "[insertManyRedshiftChargingStations] time milliseconds: ",
        statementDesc.Duration! / 1000 / 1000
      );
      break;
    }
  }
}

export async function getChargingStationsById(id: string) {
  const query = `select * from chargingstations where chargingstationid = '${id}'`;

  const res = await redShiftClient.send(
    new ExecuteStatementCommand({
      Database: "dev",
      SecretArn: redShiftSecretArn,
      WorkgroupName: "default-workgroup",
      Sql: query,
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
      hasResultSet = statementDesc.HasResultSet!;
      break;
    }
  }

  if (!hasResultSet) {
    throw new Error(`Query failed`);
  }

  const results = await redShiftClient.send(
    new GetStatementResultCommand({
      Id: res.Id!,
    })
  );

  if (!results.Records) {
    return null;
  }

  const row = results.Records[0];

  return {
    chargingstationid: row[0].stringValue,
    locationid: row[1].stringValue,
    createdat: row[2].stringValue,
  };
}

function buildInsertManyChargingStationStatement(
  chargingstations: RedshiftChargingStation[]
) {
  const rows = chargingstations
    .map((chargingstation) => {
      return `(
    '${chargingstation.chargingstationid}',
    '${chargingstation.locationid}',
    '${chargingstation.createdat}'
    )`;
    })
    .join(",");

  return `insert into chargingstations values ${rows}`;
}

export type RedshiftChargingStation = {
  chargingstationid: string;
  locationid: string;
  createdat: string;
};

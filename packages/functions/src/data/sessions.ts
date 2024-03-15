import {
  ExecuteStatementCommand,
  DescribeStatementCommand,
} from "@aws-sdk/client-redshift-data";
import { redShiftClient, redShiftSecretArn } from "./redshift-data-api";

export async function insertManyRedshiftSessions(
  redshiftSessions: RedshiftSession[]
) {
  const query = buildInsertManySessionStatement(redshiftSessions);

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
        "[insertManyRedshiftSessions] time milliseconds: ",
        statementDesc.Duration! / 1000 / 1000
      );
      break;
    }
  }
}

function buildInsertManySessionStatement(sessions: RedshiftSession[]) {
  const rows = sessions
    .map((session) => {
      return `(
    '${session.sessionid}',
    '${session.networkid}',
    ${session.connectorid},
    '${session.chargingstationid}',
    '${session.rateid}',
    '${session.tokenid}',
    ${session.totalcost},
    ${session.energycost},
    ${session.timecost},
    ${session.idlecost},
    ${session.flatcost},
    ${session.energyusage},
    ${session.meterstart},
    ${session.meterstop},
    '${session.starttime}',
    '${session.endtime}'
    )`;
    })
    .join(",");

  return `insert into sessions values ${rows}`;
}

export type RedshiftSession = {
  sessionid: string;
  networkid: string;
  connectorid: number;
  chargingstationid: string;
  rateid: string;
  tokenid: string;
  totalcost: number;
  energycost: number;
  timecost: number;
  idlecost: number;
  flatcost: number;
  energyusage: number;
  meterstart: number;
  meterstop: number;
  starttime: string;
  endtime: string;
};

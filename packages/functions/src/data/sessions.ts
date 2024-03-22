import { executeStatement } from "./db";

export async function insertManySessions(sessions: Session[]) {
  const query = buildInsertManySessionStatement(sessions);

  await executeStatement(query);
}

function buildInsertManySessionStatement(sessions: Session[]) {
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
    ${session.idletime},
    ${session.meterstart},
    ${session.meterstop},
    '${session.starttime}',
    '${session.endtime}'
    )`;
    })
    .join(",");

  return `insert into sessions values ${rows}`;
}

export type Session = {
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
  idletime: number;
  meterstart: number;
  meterstop: number;
  starttime: string;
  endtime: string;
};

import { executeStatement } from "./db";

export async function insertManyRedshiftChargingStations(
  chargingstation: RedshiftChargingStation[]
) {
  const query = buildInsertManyChargingStationStatement(chargingstation);

  await executeStatement(query);
}

export async function getChargingStationsById(id: string) {
  const query = `select * from charging_stations where charging_station_id = '${id}'`;

  const result = await executeStatement(query);

  if (!result || result.length === 0) return null;

  const row = result[0];

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

  return `insert into charging_stations values ${rows}`;
}

export type RedshiftChargingStation = {
  chargingstationid: string;
  locationid: string;
  createdat: string;
};

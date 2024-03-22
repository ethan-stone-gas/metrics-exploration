import { Client } from "pg";
import { retrieveSecret } from "../utils/secretManager";

export const metricsSecretArn = process.env.METRICS_SECRET_ARN;

let client: Client | null = null;

async function getClient() {
  if (!metricsSecretArn) {
    throw new Error("METRICS_SECRET_ARN is not defined");
  }

  if (!client) {
    const secret = await retrieveSecret(metricsSecretArn, [
      "password",
      "port",
      "host",
      "username",
      "dbname",
    ]);

    const connectionString = `postgresql://${secret.username}:${secret.password}@${secret.host}:${secret.port}/${secret.dbname}?sslmode=no-verify`;

    client = new Client({
      ssl: true,
      connectionString: connectionString,
    });

    await client.connect();
  }

  return client;
}

export async function executeStatement(query: string) {
  const client = await getClient();

  const res = await client.query(query);

  if (!res.rows) return null;

  return res.rows;
}

export function formatDateToTimestamp(date: Date) {
  const year = date.getUTCFullYear();
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const milliseconds = date.getUTCMilliseconds();

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

import { RedshiftDataClient } from "@aws-sdk/client-redshift-data";

export const redShiftSecretArn = process.env.REDSHIFT_SECRET_ARN!;

export const redShiftClient = new RedshiftDataClient({
  region: "us-east-1",
});

export function formatDateToTimestamp(date: Date) {
  const year = date.getFullYear();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

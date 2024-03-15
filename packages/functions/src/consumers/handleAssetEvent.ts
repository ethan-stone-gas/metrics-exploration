import { formatDateToTimestamp } from "src/data/db";
import {
  RedshiftChargingStation,
  insertManyRedshiftChargingStations,
} from "../data/chargingstations";
import { createKafakHandler } from "../utils/createKafkaHandler";
import { Asset } from "./eventTypes/asset-v2";

export const main = createKafakHandler<Asset>({
  schemaVersionId: "schema-version-id",
  eachBatch: async ({ batch }) => {
    for (const messageThatFailedSchemaValidation of batch.messagesFailedSchemaValidation) {
      console.error(
        `Message failed schema validation: ${messageThatFailedSchemaValidation.value}`
      );
    }

    let chargingstations: RedshiftChargingStation[] = [];

    for (const message of batch.messages) {
      if (chargingstations.length === 200) {
        // if we hit 200 chargingstations we should flush the batch and insert them
        await insertManyRedshiftChargingStations(chargingstations);
        chargingstations = [];
      }

      if (message.value.eventType !== "created") {
        console.log(`Skipping event type: ${message.value.eventType}`);
        continue;
      }

      const msgValue = message.value;

      const redshiftChargingStation: RedshiftChargingStation = {
        chargingstationid: msgValue.data.id,
        locationid: msgValue.data.assetGroup.id,
        createdat: formatDateToTimestamp(new Date(msgValue.data.createdAt)),
      };

      chargingstations.push(redshiftChargingStation);
    }

    // if there are any chargingstations left, insert them
    if (chargingstations.length > 0)
      await insertManyRedshiftChargingStations(chargingstations);
  },
});

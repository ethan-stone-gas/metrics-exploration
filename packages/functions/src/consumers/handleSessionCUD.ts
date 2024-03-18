import { createKafakHandler } from "../utils/createKafkaHandler";
import { SessionCUD } from "./eventTypes/session_cud";
import { RedshiftSession, insertManyRedshiftSessions } from "../data/sessions";
import { formatDateToTimestamp } from "../data/db";
import {
  getOffsetForPartitionAndTopic,
  upsertOffsetForTopicAndPartition,
} from "../data/offsets";

export const main = createKafakHandler<SessionCUD>({
  schemaVersionId: "65f9a8ee-7665-4177-b857-6c9a01b8925b",
  eachBatch: async ({ batch }) => {
    for (const messageThatFailedSchemaValidation of batch.messagesFailedSchemaValidation) {
      console.error(
        `Message failed schema validation: ${messageThatFailedSchemaValidation.value}`
      );
    }

    let sessions: RedshiftSession[] = [];

    const latestOffset = await getOffsetForPartitionAndTopic({
      partition: batch.partition,
      topic: batch.topic,
    });

    for (const message of batch.messages) {
      if (latestOffset !== null && message.offset <= latestOffset?.offset) {
        console.log(
          `Skipping message with offset ${message.offset} as it has already been processed.`
        );
        continue;
      }

      const msgValue = message.value;

      if (
        msgValue.data.status !== "COMPLETE" ||
        msgValue.eventType !== "SessionUpdated"
      ) {
        console.log(
          `Session ${msgValue.data.id} is not in COMPLETE status, so not saving yet.`
        );
        continue;
      }

      // if we hit 200 sessions we should flush the batch and insert them
      if (sessions.length === 200) {
        console.log("Inserting 200 sessions");
        await insertManyRedshiftSessions(sessions);

        // in case of failure in later batches we want to
        // save the offset of the last successful batch
        await upsertOffsetForTopicAndPartition({
          offsetnum: message.offset,
          partitionnum: batch.partition,
          topic: batch.topic,
        });

        sessions = [];
      }

      const redshiftSession: RedshiftSession = {
        sessionid: msgValue.data.id,
        networkid: msgValue.network,
        rateid: msgValue.data.rateId,
        chargingstationid: msgValue.data.chargingStationId,
        connectorid: msgValue.data.connectorId,
        tokenid: msgValue.data.tokenId,
        totalcost: msgValue.data.cost,
        idlecost: msgValue.data.costDetails.costs.idle,
        timecost: msgValue.data.costDetails.costs.time,
        energycost: msgValue.data.costDetails.costs.energy,
        flatcost: msgValue.data.costDetails.costs.flat,
        energyusage: msgValue.data.costDetails.usages.energy,
        meterstart: Math.floor(msgValue.data.meterStart),
        meterstop: Math.floor(msgValue.data.meterStop!),
        starttime: formatDateToTimestamp(new Date(msgValue.data.startTime)),
        endtime: formatDateToTimestamp(new Date(msgValue.data.endTime!)),
      };

      sessions.push(redshiftSession);
    }

    // if there are any sessions left, insert them
    if (sessions.length > 0) {
      console.log(`Inserting ${sessions.length} remaining sessions`);
      await insertManyRedshiftSessions(sessions);
    }

    await upsertOffsetForTopicAndPartition({
      offsetnum: batch.lastOffset,
      partitionnum: batch.partition,
      topic: batch.topic,
    });
  },
});

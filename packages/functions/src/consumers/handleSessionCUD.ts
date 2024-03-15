import { createKafakHandler } from "../utils/createKafkaHandler";
import { SessionCUD } from "./eventTypes/session_cud";
import { RedshiftSession, insertManyRedshiftSessions } from "../data/sessions";
import { formatDateToTimestamp } from "../data/db";

export const main = createKafakHandler<SessionCUD>({
  schemaVersionId: "65f9a8ee-7665-4177-b857-6c9a01b8925b",
  eachBatch: async ({ batch }) => {
    for (const messageThatFailedSchemaValidation of batch.messagesFailedSchemaValidation) {
      console.error(
        `Message failed schema validation: ${messageThatFailedSchemaValidation.value}`
      );
    }

    let sessions: RedshiftSession[] = [];

    for (const message of batch.messages) {
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
  },
});

import { GetSchemaVersionCommand, GlueClient } from "@aws-sdk/client-glue";
import Ajv from "ajv";
import addformats from "ajv-formats";

const ajv = new Ajv({ allErrors: true });

addformats(ajv);

export const decode = <T>(schema: string, buffer: Buffer): T => {
  const data = JSON.parse(buffer.toString());

  let validate = ajv.getSchema(schema);

  if (!validate) {
    validate = ajv.addSchema(JSON.parse(schema), schema).getSchema(schema);
    if (!validate)
      throw new Error("Error adding schema to ajv. The schema may be invalid");
  }

  const valid = validate(data);

  if (!valid)
    throw new Error("Schema Error: ".concat(ajv.errorsText(validate.errors)));

  return data as T;
};

const schemaCache = new Map<string, string>();
const glueClient = new GlueClient({});

const getSchema = async (key: string) => {
  const existingSchema = schemaCache.get(key);

  if (existingSchema) return existingSchema;

  const result = await glueClient.send(
    new GetSchemaVersionCommand({
      SchemaVersionId: key,
    })
  );

  if (!result.SchemaDefinition)
    throw Error(
      `schema was found but no definition was returned for schema id ${result.SchemaVersionId}`
    );

  schemaCache.set(key, result.SchemaDefinition);

  return result.SchemaDefinition;
};

type Message<TRecord> = {
  offset: number;
  value: TRecord;
};

type Batch<TRecord> = {
  firstOffset: number;
  lastOffset: number;
  messages: Message<TRecord>[];
  messagesFailedSchemaValidation: Message<string>[];
  partition: number;
  topic: string;
};

type Config<TRecord> = {
  /**
   * The schema version id to retrieve and validation records with
   */
  schemaVersionId: string;
  eachBatch: (args: { batch: Batch<TRecord> }) => Promise<void>;
};

export function createKafakHandler<TRecord>(
  config: Config<TRecord>
): AWSLambda.MSKHandler {
  return async (event) => {
    const schema = await getSchema(config.schemaVersionId);

    for (const [, topicRecords] of Object.entries(event.records)) {
      const validatedMessages: Message<TRecord>[] = [];
      const invalidMessages: Message<string>[] = [];

      for (const record of topicRecords) {
        try {
          const validatedMessage = decode<TRecord>(
            schema,
            Buffer.from(record.value, "base64")
          );

          validatedMessages.push({
            offset: record.offset,
            value: validatedMessage,
          });
        } catch (error) {
          console.log(error);
          invalidMessages.push({
            offset: record.offset,
            value: record.value,
          });
        }
      }

      await config.eachBatch({
        batch: {
          firstOffset: topicRecords[0].offset,
          lastOffset: topicRecords[topicRecords.length - 1].offset,
          messages: validatedMessages,
          partition: topicRecords[0].partition,
          topic: topicRecords[0].topic,
          messagesFailedSchemaValidation: invalidMessages,
        },
      });
    }
  };
}

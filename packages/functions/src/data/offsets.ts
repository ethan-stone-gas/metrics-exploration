import { executeStatement } from "./db";

export async function upsertOffsetForTopicAndPartition({
  partitionnum,
  topic,
  offsetnum,
}: {
  topic: string;
  partitionnum: number;
  offsetnum: number;
}) {
  const existingOffset = await getOffsetForPartitionAndTopic({
    partition: partitionnum,
    topic,
  });

  if (existingOffset) {
    await updateOffsetForTopicAndPartition({
      partitionnum,
      topic,
      offsetnum,
    });
  } else {
    await insertOffset({
      topic,
      partitionnum,
      offsetnum,
    });
  }
}

async function insertOffset(offset: Offset) {
  const query = `insert into offsets values ('${offset.topic}', ${offset.partitionnum}, ${offset.offsetnum})`;

  await executeStatement(query);
}

async function updateOffsetForTopicAndPartition({
  partitionnum,
  topic,
  offsetnum,
}: {
  topic: string;
  partitionnum: number;
  offsetnum: number;
}) {
  const query = `update offsets set offset_num = ${offsetnum} where topic = '${topic}' and partition_num = ${partitionnum}`;

  await executeStatement(query);
}

export async function getOffsetForPartitionAndTopic({
  partition,
  topic,
}: {
  topic: string;
  partition: number;
}) {
  const query = `select * from offsets where topic = '${topic}' and partition_num = ${partition}`;

  const result = await executeStatement(query);

  if (!result) return null;

  const row = result[0];

  if (!row) return null;

  return {
    topic: row.topic!,
    partition: row.partition_num!,
    offset: row.offset_num!,
  };
}

// partition and offset are reserved words in Redshift so they are
// suffixed with num
export type Offset = {
  topic: string;
  partitionnum: number;
  offsetnum: number;
};

# Overview

This project is an SST https://sst.dev/ project to explore Redshift and its capabilities. If you look at `packages/function/consumers` directory, you'll see some consumers written. For testing and speed I did not actually hook them up to Kafka, but instead manually called the lambda.

In production the lambda would be triggered by a Kafka event, and the lambda would then process the event and write to Redshift.

In each consumer the following happens.

1. Consumer is triggered.
2. With the help of the `createKafkaHandler` factory function, it validates all the messages in the batch against the specified schema.
3. It then calls the callback function supplied with the validated messages and all the messages that failed.
4. In the callbacks it builds a query to insert many rows in a single statement, up to 200 rows at a time. It then flushes any remaining rows.

Currently, this is using the Redshift Data API https://docs.aws.amazon.com/redshift/latest/mgmt/data-api.html to write to Redshift.

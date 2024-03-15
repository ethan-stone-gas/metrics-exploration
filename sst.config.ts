import { SSTConfig } from "sst";
import { RedshiftStack } from "./stacks/MyStack";

export default {
  config(_input) {
    return {
      name: "metrics-exploration",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(RedshiftStack);
  },
} satisfies SSTConfig;

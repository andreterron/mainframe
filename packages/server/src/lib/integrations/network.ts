import { Integration } from "../integration-types.ts";
import { Dataset } from "@mainframe-so/shared";
import find from "local-devices";

export const network: Integration = {
  name: "Network",
  authType: "none",
  tables: {
    networkDevices: {
      name: "Network Devices",
      // TODO: Delete or update the status of any devices not currently found
      get: async () => find(),
      rowId: (dataset: Dataset, row: any) => `${row.mac}`,
    },
  },
};

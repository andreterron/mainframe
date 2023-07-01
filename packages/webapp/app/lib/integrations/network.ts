import { Integration } from "../integration-types";
import { Dataset } from "../types";
import find from "local-devices";

export const network: Integration = {
    name: "Network",
    tables: {
        networkDevices: {
            name: "Network Devices",
            // TODO: Delete or update the status of any devices not currently found
            get: async () => find(),
            rowId: (dataset: Dataset & { _id: string }, row: any) =>
                `${dataset._id}_${row.mac}`,
        },
    },
};

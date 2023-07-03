import { Integration } from "./integration-types";
import { network } from "./integrations/network";
import { toggl } from "./integrations/toggl";
import { Dataset } from "./types";

export function getIntegrationFromType(
    type: string | undefined,
): Integration | null {
    if (type === "toggl") {
        return toggl;
    }
    if (type === "network") {
        return network;
    }
    return null;
}

export function getIntegrationForDataset(dataset: Dataset): Integration | null {
    return getIntegrationFromType(dataset.integrationType);
}

export function getObjectsForDataset(dataset: Dataset) {
    const integration = getIntegrationForDataset(dataset);
    if (!integration || !integration.objects) return [];
    return Object.entries(integration.objects).map(([id, obj]) => ({
        id,
        ...obj,
    }));
}

export function getTablesForDataset(dataset: Dataset) {
    const integration = getIntegrationForDataset(dataset);
    if (!integration) return [];
    return Object.entries(integration.tables).map(([id, table]) => ({
        id,
        ...table,
    }));
}

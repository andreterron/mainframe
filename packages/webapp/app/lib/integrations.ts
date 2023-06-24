import { Integration } from "./integration-types";
import { toggl } from "./integrations/toggl";
import { Dataset } from "./types";

export function getIntegrationForDataset(dataset: Dataset): Integration | null {
    if (dataset.integrationType === "toggl") {
        return toggl;
    }
    return null;
}

import { useDoc, usePouch } from "use-pouchdb";
import { useParams } from "@remix-run/react";
import { DBTypes } from "../lib/types";
import DatasetSetup from "../components/DatasetSetup";
import DatasetTokenInput from "../components/DatasetTokenInput";
import {
    getIntegrationForDataset,
    getIntegrationFromType,
} from "../lib/integrations";
import { DatasetPage } from "../components/DatasetPage";

export default function DatasetDetails() {
    const { id } = useParams();
    const db = usePouch();
    const { doc, error } = useDoc<DBTypes>(id ?? "", {}, undefined);

    const dataset = doc;

    // Functions

    function setIntegrationType(integrationType: string) {
        if (!doc || doc.type !== "dataset") {
            console.error("No doc to set integration type");
            return;
        }
        const integration = getIntegrationFromType(integrationType);
        db.put({
            ...doc,
            integrationType,
            name: doc.name ? doc.name : integration?.name,
        });
    }

    function setToken(token: string) {
        if (!doc) {
            console.error("No doc to set token");
            return;
        }
        db.put({ ...doc, token });
    }

    // Early return

    if (!dataset || error || dataset.type !== "dataset") {
        // TODO: If we get an error, we might want to throw
        if (error) console.log("useDoc error", error);
        // TODO: Loading UI if we need to
        return null;
    }

    const integration = getIntegrationForDataset(dataset);

    return (
        <div className="flex flex-col p-4">
            {/* TODO: Header */}
            {!dataset.integrationType ? (
                <DatasetSetup
                    onIntegrationSelected={(type) => setIntegrationType(type)}
                    dataset={dataset}
                />
            ) : !dataset.token ? (
                <DatasetTokenInput
                    onSubmit={(token) => setToken(token)}
                    dataset={dataset}
                />
            ) : integration ? (
                <DatasetPage dataset={dataset} integration={integration} />
            ) : (
                <span>Error: Integration not found</span>
            )}
        </div>
    );
}

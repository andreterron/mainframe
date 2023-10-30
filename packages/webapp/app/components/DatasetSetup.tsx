import { Dataset } from "../lib/types";
import { DatasetHeader } from "./DatasetHeader";

export default function DatasetSetup({
    onIntegrationSelected,
    dataset,
}: {
    onIntegrationSelected: (type: string) => void;
    dataset?: Dataset;
}) {
    return (
        <div className="flex flex-col items-start gap-4">
            <DatasetHeader dataset={dataset}>Import</DatasetHeader>
            <div className="w-full max-w-3xl grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                    className="block border shadow rounded-lg py-2 px-4"
                    onClick={() => onIntegrationSelected("toggl")}
                >
                    Toggl
                </button>
                <button
                    className="block border shadow rounded-lg py-2 px-4"
                    onClick={() => onIntegrationSelected("posthog")}
                >
                    Posthog
                </button>
                <button
                    className="block border shadow rounded-lg py-2 px-4"
                    onClick={() => onIntegrationSelected("github")}
                >
                    GitHub
                </button>
                <button
                    className="block border shadow rounded-lg py-2 px-4"
                    onClick={() => onIntegrationSelected("peloton")}
                >
                    Peloton
                </button>
                <button
                    className="block border shadow rounded-lg py-2 px-4"
                    onClick={() => onIntegrationSelected("google")}
                >
                    Google Calendar
                </button>
                {/* <button
                    className="block border shadow rounded-lg py-2 px-4"
                    onClick={() => onIntegrationSelected("network")}
                >
                    Network
                </button> */}
            </div>
        </div>
    );
}

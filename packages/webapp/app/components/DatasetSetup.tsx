export default function DatasetSetup({
    onIntegrationSelected,
}: {
    onIntegrationSelected: (type: string) => void;
}) {
    return (
        <div className="flex flex-col items-start gap-4">
            <h2 className="text-xl">Import</h2>
            <div>
                <button
                    className="border shadow rounded-lg py-1 px-4"
                    onClick={() => onIntegrationSelected("toggl")}
                >
                    Toggl
                </button>
            </div>
        </div>
    );
}

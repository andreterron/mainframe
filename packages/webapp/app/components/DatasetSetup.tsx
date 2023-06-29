export default function DatasetSetup({
    onIntegrationSelected,
}: {
    onIntegrationSelected: (type: string) => void;
}) {
    return (
        <div className="flex flex-col items-start gap-4">
            <h2 className="text-xl">Import</h2>
            <div className="w-full max-w-3xl grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                    className="block border shadow rounded-lg py-2 px-4"
                    onClick={() => onIntegrationSelected("toggl")}
                >
                    Toggl
                </button>
            </div>
        </div>
    );
}

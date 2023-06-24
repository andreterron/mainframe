import { Link } from "@remix-run/react";
import { Integration } from "../lib/integration-types";
import { Dataset } from "../lib/types";

export function DatasetPage({
    dataset,
    integration,
}: {
    dataset: Dataset & { _id: string };
    integration: Integration;
}) {
    const tableEntries = Object.entries(integration.tables);

    return (
        <div className="flex flex-col gap-8 items-start">
            <h1 className="text-2xl font-medium">{dataset.name}</h1>
            <div className="flex flex-col gap-1">
                {tableEntries.map(([tableId, table]) => (
                    <Link
                        to={`/dataset/${dataset._id}/table/${tableId}`}
                        key={tableId}
                        className="flex items-center gap-3 cursor-pointer select-none text-gray-900 bg-white focus:outline-none hover:bg-gray-100 active:bg-gray-200 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            className="humbleicons hi-database flex-grow-0 flex-shrink-0 w-5 h-5"
                        >
                            <g
                                xmlns="http://www.w3.org/2000/svg"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M20 12c0 1.657-3.582 3-8 3s-8-1.343-8-3M20 18c0 1.657-3.582 3-8 3s-8-1.343-8-3" />
                                <ellipse cx="12" cy="6" rx="8" ry="3" />
                                <path d="M4 6v12M20 6v12" />
                            </g>
                        </svg>
                        <span>{table.name}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

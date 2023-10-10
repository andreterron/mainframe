import { Link } from "react-router-dom";
import { Dataset } from "../lib/types";
import { DatasetHeader } from "./DatasetHeader";
import type { ClientIntegration } from "../lib/integration-types";

// TODO: integration type
export function DatasetPage({
    dataset,
    integration,
}: {
    dataset: Dataset;
    integration: ClientIntegration;
}) {
    const { tables, objects } = integration;

    return (
        <div className="flex flex-col gap-8 items-start">
            <DatasetHeader dataset={dataset}>{dataset.name}</DatasetHeader>
            <div className="flex flex-col gap-1">
                {objects.map((obj) => (
                    <Link
                        to={`/dataset/${dataset.id}/object/${obj.id}`}
                        key={obj.id}
                        className="flex items-center gap-3 cursor-pointer select-none text-gray-900 bg-white focus:outline-none hover:bg-gray-100 active:bg-gray-200 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            className="humbleicons hi-document flex-grow-0 flex-shrink-0 w-5 h-5"
                        >
                            <g
                                xmlns="http://www.w3.org/2000/svg"
                                strokeLinejoin="round"
                                strokeWidth="2"
                            >
                                <path d="M5 20V4a1 1 0 011-1h6.172a2 2 0 011.414.586l4.828 4.828A2 2 0 0119 9.828V20a1 1 0 01-1 1H6a1 1 0 01-1-1z" />
                                <path d="M12 3v6a1 1 0 001 1h6" />
                            </g>
                        </svg>
                        <span>{obj.name}</span>
                    </Link>
                ))}
                {tables.map((table) => (
                    <Link
                        to={`/dataset/${dataset.id}/table/${table.id}`}
                        key={table.id}
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

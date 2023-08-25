import { type LoaderArgs, json } from "@remix-run/node";
import { useDoc, useFind } from "use-pouchdb";
import { Link, useParams } from "@remix-run/react";
import { DBTypes, Row } from "../lib/types";
import { useMemo } from "react";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { apiBaseUrl } from "../lib/url";

const colHelper = createColumnHelper<PouchDB.Core.ExistingDocument<Row>>();

const LIMIT = 50;

export async function loader({ params }: LoaderArgs) {
    const datasetId = params.id;
    const tableId = params.table_id;
    if (datasetId && tableId) {
        // Trigger sync of this table
        void fetch(`${apiBaseUrl}/sync/dataset/${datasetId}/table/${tableId}`, {
            method: "POST",
        }).catch((e) => console.error(e));
    }
    return json({});
}

export default function DatasetTableDetails() {
    const { id, table_id } = useParams();
    const { doc, error } = useDoc<DBTypes>(id ?? "", {});
    const { docs, loading: rowsLoading } = useFind<Row>({
        selector: {
            type: "row",
            table: table_id,
            datasetId: id,
        },
        limit: LIMIT,
    });
    const dataset = doc;
    const rows = rowsLoading ? undefined : docs;

    let columns = useMemo(() => {
        const columnsSet = new Set<string>();
        rows?.forEach((row) =>
            Object.keys(row.data).forEach((key) => columnsSet.add(key)),
        );
        const cols = [...columnsSet].map((col) =>
            colHelper.accessor(`data.${col}`, {
                header() {
                    return col;
                },
                cell({ cell }) {
                    const value = cell.getValue();
                    return value === undefined
                        ? ""
                        : value && typeof value === "object"
                        ? Array.isArray(value)
                            ? "[...]"
                            : "{...}"
                        : JSON.stringify(value);
                },
            }),
        );
        return [
            colHelper.display({
                id: "open",
                cell({ row }) {
                    return (
                        <Link to={`/row/${row.id}`}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                className="humbleicons hi-external-link w-4 h-4"
                            >
                                <path
                                    xmlns="http://www.w3.org/2000/svg"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 6H7a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-5m-6 0l7.5-7.5M15 3h6v6"
                                />
                            </svg>
                        </Link>
                    );
                },
            }),
            ...cols,
        ];
    }, [rows]);

    const table = useReactTable({
        columns,
        data: rows ?? [],
        getCoreRowModel: getCoreRowModel(),
        getRowId(originalRow) {
            return originalRow._id;
        },
    });

    // Early return

    if (!dataset || error || dataset.type !== "dataset") {
        // TODO: If we get an error, we might want to throw
        if (error) console.log("useDoc error", error);
        // TODO: Loading UI if we need to
        return null;
    }

    return (
        <div className="flex flex-col relative max-h-screen overflow-y-auto">
            <div className="flex flex-col gap-8 items-start">
                <h1 className="text-2xl m-4 font-medium">{dataset?.name}</h1>
                <div></div>
                <div className="">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 border-separate border-spacing-0 border-t">
                        <thead className="text-sm text-gray-700 font-mono">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="">
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            scope="col"
                                            className="box-border border-b bg-gray-50 dark:bg-gray-700 dark:text-gray-400 px-6 py-3 sticky top-0"
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext(),
                                                  )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="bg-white dark:bg-gray-800 dark:border-gray-700"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className="px-6 py-4 border-b font-mono whitespace-nowrap"
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

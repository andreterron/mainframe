import { type LoaderArgs, json } from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";
import { useMemo } from "react";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { db } from "../db/db.server";
import { datasetsTable, rowsTable, tablesTable } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { deserializeData } from "../utils/serialization";
import { getDatasetTable } from "../lib/integrations";
import { syncTable } from "../../server/sync";
import { notFound } from "remix-utils";

const colHelper = createColumnHelper<Record<string, any>>();

const LIMIT = 50;

export async function loader({ params }: LoaderArgs) {
    const datasetId = params.id;
    const tableId = params.table_id;
    if (!datasetId || !tableId) {
        throw notFound({});
    }

    const [dataset] = await db
        .select()
        .from(datasetsTable)
        .where(eq(datasetsTable.id, datasetId))
        .limit(1);

    if (!dataset) {
        throw notFound({});
    }

    const table = getDatasetTable(dataset, tableId);

    if (!table) {
        throw notFound({});
    }

    // Upsert table
    await db
        .insert(tablesTable)
        .values({ datasetId: dataset.id, name: table.name, key: tableId })
        .onConflictDoNothing({
            target: [tablesTable.datasetId, tablesTable.key],
        })
        .returning();

    const rows = await db
        .select({ id: rowsTable.id, data: rowsTable.data })
        .from(rowsTable)
        .innerJoin(tablesTable, eq(tablesTable.id, rowsTable.tableId))
        .where(
            and(
                eq(tablesTable.datasetId, datasetId),
                eq(tablesTable.key, tableId),
            ),
        )
        .limit(LIMIT);

    // Trigger sync of this table in the background
    void syncTable(dataset, table).catch((e) => console.error(e));

    return json({ dataset, rows: rows.map(deserializeData) });
}

export default function DatasetTableDetails() {
    const { dataset, rows } = useLoaderData<typeof loader>();

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
            return originalRow.id;
        },
    });

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

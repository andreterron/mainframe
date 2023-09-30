import { type LoaderArgs, json, ActionArgs } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import {
    Column,
    ColumnOrderState,
    VisibilityState,
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
import { badRequest, notFound } from "remix-utils";
import { ColumnMenu } from "../components/ColumnMenu";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { EyeIcon, EyeOffIcon, MoreVerticalIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../components/ui/popover";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { Label } from "../components/ui/label";

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
    const tableRows = await db
        .insert(tablesTable)
        .values({ datasetId: dataset.id, name: table.name, key: tableId })
        .onConflictDoUpdate({
            target: [tablesTable.datasetId, tablesTable.key],
            set: { key: tableId },
        })
        .returning({ view: tablesTable.view });

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

    return json({
        dataset,
        rows: rows.map(deserializeData),
        table: tableRows.at(0),
    });
}

export async function action({ request, params }: ActionArgs) {
    if (request.method === "PUT") {
        const body = await request.formData();
        const view = body.get("view");
        const datasetId = params.id;
        const tableId = params.table_id;
        // TODO: Check if this tableId is correct
        if (typeof view === "string" && datasetId && tableId) {
            // TODO: Make sure view is what we expect before saving
            console.log("table_id:", params.table_id);
            const returned = await db
                .update(tablesTable)
                .set({ view: view })
                .where(
                    and(
                        eq(tablesTable.datasetId, datasetId),
                        eq(tablesTable.key, tableId),
                    ),
                )
                .returning();
            console.log("RETURNED", returned);
            return json({ success: true });
        }
        return badRequest({ message: "Invalid view or tableId" });
    }
    return json({ message: "Method not allowed" }, { status: 405 });
}

function ColumnMenuItem({
    column,
}: {
    column: Column<Record<string, any>, unknown>;
}) {
    const name = (column.columnDef.meta as any)?.name;
    if (!name) return null;
    return (
        <div
            className="flex items-center gap-1"
            onClick={() => {
                column.toggleVisibility();
            }}
        >
            <span className="flex-1 min-w-0">{name}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7">
                {column.getIsVisible() ? (
                    <EyeIcon className="w-4 h-4" />
                ) : (
                    <EyeOffIcon className="w-4 h-4" />
                )}
            </Button>
        </div>
    );
}

export default function DatasetTableDetails() {
    const { dataset, rows, table: dbTable } = useLoaderData<typeof loader>();
    const fetcher = useFetcher<typeof action>();
    console.log;
    const view = dbTable?.view ? JSON.parse(dbTable.view) ?? {} : {};
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        view.columnVisibility ?? {},
    );
    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
        view.columnOrder ?? [],
    );

    useEffect(() => {
        // TODO: Avoid writing this too many times
        fetcher.submit(
            { view: JSON.stringify({ columnVisibility, columnOrder }) },
            { method: "PUT" },
        );
    }, [columnVisibility, columnOrder]);

    // fetcher.submit({ serialized: "values" }, { method: "PUT" });

    let columns = useMemo(() => {
        const columnsSet = new Set<string>();
        rows?.forEach((row) =>
            Object.keys(row.data).forEach((key) => columnsSet.add(key)),
        );
        const cols = [...columnsSet].map((col) =>
            colHelper.accessor<`data.${string}`, { name: string }>(
                `data.${col}`,
                {
                    meta: {
                        name: col,
                    },
                    header(args) {
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
                },
            ),
        );
        return [
            colHelper.display({
                id: "_open",
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
        state: {
            columnVisibility,
            columnOrder,
        },
        onColumnVisibilityChange: setColumnVisibility,
        onColumnOrderChange: setColumnOrder,
        getCoreRowModel: getCoreRowModel(),
        getRowId(originalRow) {
            return originalRow.id;
        },
    });

    return (
        <div className="flex flex-col relative max-h-screen overflow-y-auto">
            <div className="flex flex-col gap-8 items-start">
                <div className="flex w-full items-center p-4">
                    <h1 className="text-2xl font-medium flex-1">
                        {dataset?.name}
                    </h1>
                    <Popover>
                        {/* className="ml-2 inline-flex justify-center rounded-md text-gray-400 bg-black bg-opacity-0 p-1.5 text-sm font-medium hover:bg-opacity-5 data-[state=open]:bg-opacity-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-opacity-75" */}
                        <PopoverTrigger>
                            <MoreVerticalIcon className="h-4 w-4" />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto">
                            <Label>Columns</Label>
                            <Separator />
                            <div className="flex flex-col gap-1">
                                {table.getVisibleLeafColumns().map((column) => (
                                    <ColumnMenuItem column={column} />
                                ))}
                                {table
                                    .getAllFlatColumns()
                                    .filter((c) => !c.getIsVisible())
                                    .map((column) => (
                                        <ColumnMenuItem column={column} />
                                    ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                    {/* <DropdownMenu>
                        <DropdownMenuTrigger className="ml-2 inline-flex justify-center rounded-md text-gray-400 bg-black bg-opacity-0 p-1.5 text-sm font-medium hover:bg-opacity-5 data-[state=open]:bg-opacity-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-opacity-75">
                            <MoreVerticalIcon className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {table.getVisibleLeafColumns().map((column) => (
                                <ColumnMenuItem column={column} />
                            ))}
                            {table
                                .getAllFlatColumns()
                                .filter((c) => !c.getIsVisible())
                                .map((column) => (
                                    <ColumnMenuItem column={column} />
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu> */}
                    {/* <button
                        className="flex grow-0 shrink-0 gap-1 p-2 rounded hover:bg-gray-200"
                        // onClick={handleDelete}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            className="humbleicons hi-trash text-black w-5 h-5"
                        >
                            <path
                                xmlns="http://www.w3.org/2000/svg"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 6l.934 13.071A1 1 0 007.93 20h8.138a1 1 0 00.997-.929L18 6m-6 5v4m8-9H4m4.5 0l.544-1.632A2 2 0 0110.941 3h2.117a2 2 0 011.898 1.368L15.5 6"
                            />
                        </svg>
                    </button> */}
                </div>
                {/* <h1 className="text-2xl m-4 font-medium">{dataset?.name}</h1> */}
                <div></div>
                <div className="max-w-full overflow-auto">
                    <table className="text-sm text-left text-gray-500 dark:text-gray-400 border-separate border-spacing-0 border-t">
                        <thead className="text-sm text-gray-700 font-mono">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="">
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            scope="col"
                                            className="group box-border border-b bg-gray-50 dark:bg-gray-700 dark:text-gray-400 px-6 py-3 sticky top-0"
                                        >
                                            <span className="flex items-center">
                                                <span className="flex-grow overflow-hidden text-ellipsis">
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                              header.column
                                                                  .columnDef
                                                                  .header,
                                                              header.getContext(),
                                                          )}
                                                </span>
                                                {header.column.id !==
                                                "_open" ? (
                                                    <ColumnMenu
                                                        header={header}
                                                    />
                                                ) : null}
                                            </span>
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

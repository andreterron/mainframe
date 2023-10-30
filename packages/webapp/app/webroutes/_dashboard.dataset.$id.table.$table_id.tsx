import { Link, useParams } from "react-router-dom";
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
import { ColumnMenu } from "../components/ColumnMenu";
import { Code2Icon, EyeIcon, EyeOffIcon, MoreVerticalIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../components/ui/popover";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { Label } from "../components/ui/label";
import { cn } from "../lib/utils";
import { trpc } from "../lib/trpc_client";
import { SadPath } from "../components/SadPath";
import { ApiHelper } from "../components/ApiHelper";

const colHelper = createColumnHelper<Record<string, any>>();

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
            <span
                className={cn(
                    "flex-1 min-w-0",
                    column.getIsVisible() ? "" : "text-muted-foreground italic",
                )}
            >
                {name}
            </span>
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
    const params = useParams();
    const datasetId = params.id;
    const tableId = params.table_id;
    const { data, error, isLoading } = trpc.tablesPageLoader.useQuery({
        datasetId,
        tableId,
    });
    const dataset = data?.dataset,
        rows = data?.rows,
        dbTable = data?.table;
    const view = dbTable?.view ? JSON.parse(dbTable.view) ?? {} : {};
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        view.columnVisibility ?? {},
    );
    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
        view.columnOrder ?? [],
    );

    const updateTableView = trpc.tablesUpdateView.useMutation();

    useEffect(() => {
        if (!datasetId || !tableId) {
            console.error("Invalid dataset or table ID");
            return;
        }
        // TODO: Avoid writing this too many times
        updateTableView.mutate({
            datasetId,
            tableId,
            view: JSON.stringify({ columnVisibility, columnOrder }),
        });
    }, [columnVisibility, columnOrder, datasetId, tableId]);

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

    if (!dataset || !dbTable) {
        return (
            <SadPath
                className="p-4"
                error={error ?? undefined}
                isLoading={isLoading}
            />
        );
    }

    return (
        <div className="flex flex-col relative max-h-screen overflow-y-auto">
            <div className="flex flex-col gap-8 items-start">
                <div className="flex w-full items-center p-4">
                    <h1 className="text-2xl font-medium flex-1">
                        {dataset?.name}
                    </h1>
                    <ApiHelper apiPath={`table/${dbTable.id}/rows`}>
                        <button className="ml-2 inline-flex justify-center rounded-md bg-black bg-opacity-0 p-1.5 text-sm font-medium hover:bg-opacity-5 data-[state=open]:bg-opacity-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-opacity-75">
                            <Code2Icon className="h-4 w-4" />
                        </button>
                    </ApiHelper>
                    <Popover>
                        <PopoverTrigger className="ml-2 inline-flex justify-center rounded-md bg-black bg-opacity-0 p-1.5 text-sm font-medium hover:bg-opacity-5 data-[state=open]:bg-opacity-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-opacity-75">
                            <MoreVerticalIcon className="h-4 w-4" />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto px-0 py-1">
                            <Label className="px-4 py-3 block">Columns</Label>
                            <Separator className="w-full h-px bg-border" />
                            <div className="flex flex-col gap-1 px-4 py-2">
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
                </div>
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

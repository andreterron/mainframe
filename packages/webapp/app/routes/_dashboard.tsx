import { useState } from "react";
import clsx from "clsx";
import { Outlet } from "@remix-run/react";
import { useAllDocs, usePouch } from "use-pouchdb";

export interface Table {
    type: "table";
    name: string;
}

export default function Dashboard() {
    // const [tables, setTables] = useState<{ id: string; name: string }[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const db = usePouch<Table>(); // get the database

    const handleAddTable = async () => {
        const id = Math.random().toString(36).substring(2, 8);
        const doc = { _id: id, type: "table" as const, name: "" };

        await db.put(doc);
    };

    const { rows, loading } = useAllDocs<Table>({
        include_docs: true, // Load all document bodies
    });

    console.log(rows);

    const tables = rows.map((row) => row.doc!);

    return (
        <div>
            <button
                data-drawer-target="default-sidebar"
                data-drawer-toggle="default-sidebar"
                aria-controls="default-sidebar"
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="inline-flex items-center p-2 mt-2 ml-3 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            >
                <span className="sr-only">Open sidebar</span>
                <svg
                    className="w-6 h-6"
                    aria-hidden="true"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        clipRule="evenodd"
                        fillRule="evenodd"
                        d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                    ></path>
                </svg>
            </button>

            <aside
                id="default-sidebar"
                className={clsx([
                    "fixed top-0 left-0 z-40 w-64 h-screen transition-transform sm:translate-x-0 border-r-2 border-gray-400",
                    sidebarOpen ? "" : "-translate-x-full",
                ])}
                aria-label="Sidebar"
            >
                <div className="h-full flex flex-col justify-between px-3 py-4 overflow-y-auto bg-white sm:bg-gray-100 dark:bg-gray-800">
                    <ul className="w-full font-medium flex-shrink">
                        {tables.map((table) => {
                            return (
                                <li key={table._id}>
                                    <span className="block group py-1 cursor-pointer">
                                        <span
                                            className={clsx([
                                                "flex items-center p-2 rounded-lg",
                                                "text-gray-900 dark:text-white",
                                                "group-hover:bg-gray-200 dark:group-hover:bg-gray-700",
                                            ])}
                                        >
                                            <span className="relative">
                                                {table.name ? (
                                                    table.name
                                                ) : (
                                                    <span className="text-gray-400">
                                                        Untitled
                                                    </span>
                                                )}
                                            </span>
                                        </span>
                                    </span>
                                </li>
                            );
                        })}
                        <li>
                            <button
                                onClick={() => {
                                    handleAddTable();
                                }}
                                className="block w-full group py-1 cursor-pointer"
                            >
                                <span
                                    className={clsx([
                                        "flex w-full items-center p-2 rounded-lg",
                                        "text-gray-400 dark:text-gray-200",
                                        "group-hover:bg-gray-200 dark:group-hover:bg-gray-700",
                                    ])}
                                >
                                    <span className="">New Table</span>
                                </span>
                            </button>
                        </li>
                    </ul>
                </div>
            </aside>

            <div
                onClick={() => setSidebarOpen(false)}
                className={clsx([
                    "fixed top-0 left-0 bottom-0 right-0 sm:hidden bg-black transition-opacity z-30",
                    sidebarOpen
                        ? "opacity-25"
                        : "opacity-0 pointer-events-none",
                ])}
            />

            <div className="p-4 sm:ml-64">
                <Outlet />
            </div>
        </div>
    );
}

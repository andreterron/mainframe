import { useState } from "react";
import clsx from "clsx";
import { NavLink, Outlet, useLoaderData, useNavigate } from "@remix-run/react";
import { usePouch, useFind } from "use-pouchdb";
import { db } from "../lib/db";
import { json } from "@remix-run/node";
import { DBTypes, Dataset } from "../lib/types";
import { getIntegrationForDataset } from "../lib/integrations";

export async function loader() {
    const docs = (await db.find({
        selector: {
            type: "dataset",
        },
    })) as PouchDB.Find.FindResponse<Dataset>;
    if (docs.warning) {
        console.warn(docs.warning);
    }
    return json({
        initialRows: docs.docs,
    });
}

export function SidebarButton({
    dataset,
}: {
    dataset: Dataset & { _id: string };
}) {
    const integration = getIntegrationForDataset(dataset);
    return (
        <NavLink to={`/dataset/${dataset._id}`} className={"block group py-1"}>
            {({ isActive }) => (
                <span
                    className={clsx([
                        "flex items-center gap-1.5 p-2 rounded-lg",
                        "text-slate-900",
                        "group-hover:bg-sky-300/40",
                        "relative before:border before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:rounded-lg",
                        isActive
                            ? "before:bg-white before:border-gray-400 shadow-0-2"
                            : "before:bg-transparent before:border-transparent shadow-0",
                    ])}
                >
                    {integration?.icon ? (
                        <img
                            className="relative h-4 w-4 m-0.5"
                            src={integration.icon}
                        />
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            className="relative humbleicons hi-layers h-4 w-4 m-0.5"
                        >
                            <g
                                xmlns="http://www.w3.org/2000/svg"
                                stroke="currentColor"
                                stroke-linejoin="round"
                                stroke-width="2"
                            >
                                <path d="M4 8l8-4 8 4-8 4-8-4z" />
                                <path
                                    stroke-linecap="round"
                                    d="M4 12l8 4 8-4M4 16l8 4 8-4"
                                />
                            </g>
                        </svg>
                    )}
                    <span className="relative">
                        {dataset.name ? (
                            dataset.name
                        ) : (
                            <span
                                className={clsx([
                                    "text-slate-400",
                                    isActive
                                        ? "text-slate-500"
                                        : "group-hover:text-slate-500",
                                ])}
                            >
                                Untitled
                            </span>
                        )}
                    </span>
                </span>
            )}
        </NavLink>
    );
}

export default function Dashboard() {
    const { initialRows } = useLoaderData<typeof loader>();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const db = usePouch<DBTypes>();

    const handleAddDataset = async () => {
        const id = Math.random().toString(36).substring(2, 8);
        const doc = { _id: id, type: "dataset" as const, name: "" };

        const dataset = await db.put(doc);
        navigate(`/dataset/${dataset.id}`);
    };

    const { docs: rows, loading } = useFind<Dataset>({
        selector: {
            type: "dataset",
        },
    });

    // const { rows, loading } = useAllDocs<DBTypes>({ include_docs: true });

    const datasets = loading && !rows?.length ? initialRows : rows;

    return (
        <div>
            <button
                data-drawer-target="default-sidebar"
                data-drawer-toggle="default-sidebar"
                aria-controls="default-sidebar"
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="inline-flex items-center p-2 mt-2 ml-3 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
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
                <div className="h-full flex flex-col justify-between px-3 py-4 overflow-y-auto bg-gradient-to-b from-sky-100 to-sky-200">
                    <ul className="w-full font-medium flex-shrink">
                        {datasets.map((dataset) => {
                            return (
                                <li key={dataset._id}>
                                    <SidebarButton dataset={dataset} />
                                </li>
                            );
                        })}
                        <li>
                            <button
                                onClick={() => handleAddDataset()}
                                className="block w-full group py-1 cursor-pointer"
                            >
                                <span
                                    className={clsx([
                                        "flex w-full items-center gap-1.5 p-2 rounded-lg",
                                        "text-slate-400 group-hover:text-sky-600",
                                        "group-hover:bg-sky-300/40",
                                    ])}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        className="humbleicons hi-plus w-5 h-5"
                                    >
                                        <g
                                            xmlns="http://www.w3.org/2000/svg"
                                            stroke="currentColor"
                                            stroke-linecap="round"
                                            stroke-width="2"
                                        >
                                            <path d="M12 19V5M19 12H5" />
                                        </g>
                                    </svg>
                                    <span className="">New Dataset</span>
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

            <div className="sm:ml-64">
                <Outlet />
            </div>
        </div>
    );
}

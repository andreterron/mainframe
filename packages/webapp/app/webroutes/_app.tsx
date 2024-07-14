import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useMatch,
  useNavigate,
  useNavigation,
} from "react-router-dom";
import { Dataset } from "@mainframe-api/shared";
import { datasetIcon } from "../lib/integrations/icons/datasetIcon";
import { trpc } from "../lib/trpc_client";
import { useLogout } from "../lib/use-logout";
import { Loader2Icon } from "lucide-react";
import { Sidebar } from "../components/sidebar";
import { posthog } from "../lib/analytics";
import { env } from "../lib/env_client";

export function SidebarButton({ dataset }: { dataset: Dataset }) {
  const type = dataset.integrationType;
  const icon = type ? datasetIcon(type) : undefined;
  return (
    <NavLink to={`/dataset/${dataset.id}`} className={"block group py-1"}>
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
          {icon ? (
            <img className="relative h-4 w-4 m-0.5 object-contain" src={icon} />
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
                strokeLinejoin="round"
                strokeWidth="2"
              >
                <path d="M4 8l8-4 8 4-8 4-8-4z" />
                <path strokeLinecap="round" d="M4 12l8 4 8-4M4 16l8 4 8-4" />
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
                  isActive ? "text-slate-500" : "group-hover:text-slate-500",
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

export default function AppPages() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const loc = useLocation();

  const { data: authInfo, isFetching } = trpc.authInfo.useQuery();

  useEffect(() => {
    if (authInfo && !env.VITE_AUTH_PASS && posthog) {
      const user = authInfo.user;
      if (user) {
        posthog.identify(user.id, { email: user.email, name: user.name });
      } else {
        posthog.identify(undefined);
      }
    }
    if (!isFetching && authInfo && !authInfo.isLoggedIn) {
      navigate(authInfo.hasUsers ? "/login" : "/setup");
    }
  }, [authInfo]);

  // Close sidebar if the user navigates. Important for mobile.
  // Non-mobile sidebar is always open.
  useEffect(() => {
    setSidebarOpen(false);
  }, [loc.pathname]);

  return (
    <>
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

      <Sidebar sidebarOpen={sidebarOpen} />

      <div
        onClick={() => setSidebarOpen(false)}
        className={clsx([
          "fixed top-0 left-0 bottom-0 right-0 sm:hidden bg-black transition-opacity z-30",
          sidebarOpen ? "opacity-25" : "opacity-0 pointer-events-none",
        ])}
      />

      <div className="sm:ml-64">
        <Outlet />
      </div>
    </>
  );
}

import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  Link,
  NavLink,
  Outlet,
  useMatch,
  useNavigate,
  useNavigation,
} from "react-router-dom";
import { Dataset } from "@mainframe-so/shared";
import { datasetIcon } from "../lib/integrations/icons/datasetIcon";
import { trpc } from "../lib/trpc_client";
import { useLogout } from "../lib/use-logout";
import { Loader2Icon } from "lucide-react";

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

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const logout = useLogout();
  const navigation = useNavigation();
  const isIndexPath = useMatch("/");

  const { data: authInfo, isFetching } = trpc.authInfo.useQuery();
  const { data: datasets, refetch } = trpc.datasetsAll.useQuery();

  useEffect(() => {
    if (!isFetching && authInfo && !authInfo.isLoggedIn) {
      navigate(authInfo.hasUsers ? "/login" : "/setup");
    }
  }, [authInfo]);

  const datasetsCreate = trpc.datasetsCreate.useMutation({
    onSettled() {
      refetch();
    },
  });

  const handleAddDataset = async () => {
    const dataset = await datasetsCreate.mutateAsync({});
    navigate(`/dataset/${dataset.id}`);
  };

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
            {(datasets ?? []).map((dataset) => {
              return (
                <li key={dataset.id}>
                  <SidebarButton dataset={dataset} />
                </li>
              );
            })}
            <li>
              <NavLink
                // onClick={() => handleAddDataset()}
                to="/new"
                className="block w-full group py-1 cursor-pointer"
              >
                {({ isActive }) => (
                  <span
                    className={clsx([
                      "flex w-full items-center gap-1.5 p-2 rounded-lg",
                      "group-hover:bg-sky-300/40",
                      "relative before:border before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:rounded-lg",
                      isActive || isIndexPath
                        ? "before:bg-white before:border-gray-400 shadow-0-2"
                        : "before:bg-transparent before:border-transparent shadow-0 group-hover:text-sky-600",
                    ])}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      className="relative humbleicons hi-plus w-5 h-5"
                    >
                      <g
                        xmlns="http://www.w3.org/2000/svg"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="2"
                      >
                        <path d="M12 19V5M19 12H5" />
                      </g>
                    </svg>
                    <span className="relative ">New Dataset</span>
                  </span>
                )}
              </NavLink>
            </li>
          </ul>
          <div className="flex gap-2">
            <button
              onClick={() => {
                logout.mutate();
              }}
              className={clsx([
                "flex w-0 flex-1 items-center gap-1.5 p-2 rounded-lg",
                "text-slate-600 hover:text-sky-600",
                "hover:bg-sky-300/40",
              ])}
              disabled={logout.isLoading}
            >
              Logout{" "}
              <Loader2Icon
                className={clsx(
                  "animate-spin ml-1 w-4 h-4 transition-opacity delay-75",
                  logout.isLoading || logout.data ? "opacity-100" : "opacity-0",
                )}
              />
            </button>
            <a
              href="https://discord.gg/HUS4y59Dxw"
              target="_blank"
              rel="noopener noreferrer"
              title="Discord"
              className={clsx([
                "flex items-center justify-center gap-1.5 p-2 rounded-lg",
                "text-slate-600 hover:text-sky-600",
                "hover:bg-sky-300/40",
                "h-10 w-10 text-center",
              ])}
            >
              <svg
                viewBox="0 -28.5 256 256"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                preserveAspectRatio="xMidYMid"
                fill="currentColor"
                className="w-4 h-4"
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  <g>
                    <path
                      d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
                      fill="currentColor"
                      fillRule="nonzero"
                    ></path>
                  </g>
                </g>
              </svg>
            </a>
          </div>
        </div>
      </aside>

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
    </div>
  );
}

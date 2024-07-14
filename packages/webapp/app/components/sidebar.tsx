import { cn } from "~/lib/utils";
import { Link, NavLink, useMatch } from "react-router-dom";
import { datasetIcon } from "../lib/integrations/icons/datasetIcon";
import { Dataset } from "@mainframe-api/shared";
import { useLogout } from "../lib/use-logout";
import { LayoutGridIcon, LineChartIcon, Loader2Icon } from "lucide-react";
import { trpc } from "../lib/trpc_client";
import { ReactNode } from "react";

interface SidebarProps {
  sidebarOpen: boolean;
}

export function SidebarButton({
  icon,
  href,
  name,
  className,
  isActive,
}: {
  className?: string;
  icon: ReactNode;
  href: string;
  name: (props: { isActive: boolean }) => ReactNode;
  isActive?: (isNavLinkActive: boolean) => boolean;
}) {
  return (
    <NavLink
      to={href}
      className={cn("block group py-1 font-medium", className)}
    >
      {({ isActive: isNavLinkActive }) => (
        <span
          className={cn([
            "flex items-center gap-1.5 px-2 py-2 rounded-lg",
            "text-slate-900",
            "group-hover:bg-slate-300/40",
            "relative before:border before:absolute before:top-0 before:left-0 before:right-0 before:bottom-0 before:rounded-lg",
            (isActive ? isActive(isNavLinkActive) : isNavLinkActive)
              ? "before:bg-white before:border-slate-900 shadow-0-2 text-black"
              : "before:bg-transparent before:border-transparent shadow-0 text-black/60",
          ])}
        >
          {icon}
          <span className="relative whitespace-nowrap overflow-hidden text-ellipsis text-sm">
            {name({ isActive: isNavLinkActive })}
          </span>
        </span>
      )}
    </NavLink>
  );
}

export function SidebarDatasetButton({ dataset }: { dataset: Dataset }) {
  const type = dataset.integrationType;
  const icon = type ? datasetIcon(type) : undefined;

  return (
    <SidebarButton
      href={`/dataset/${dataset.id}`}
      icon={
        icon ? (
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
        )
      }
      name={({ isActive }) =>
        dataset.name ? (
          dataset.name
        ) : (
          <span
            className={cn([
              "text-slate-400",
              isActive ? "text-slate-500" : "group-hover:text-slate-500",
            ])}
          >
            Untitled
          </span>
        )
      }
    />
  );
}

export function Sidebar({ sidebarOpen }: SidebarProps) {
  const isIndexPath = useMatch("/");
  const logout = useLogout();
  const { data: datasets } = trpc.datasetsAll.useQuery();
  const { data: components } = trpc.getAllComponents.useQuery();
  const hideDashboard = !components?.length;

  return (
    <aside
      id="default-sidebar"
      className={cn([
        "fixed top-0 left-0 z-40 w-64 h-screen transition-transform sm:translate-x-0",
        sidebarOpen ? "" : "-translate-x-full",
      ])}
      aria-label="Sidebar"
    >
      <div className="h-full flex flex-col px-3 py-4 overflow-y-auto bg-gradient-to-b from-sky-50 to-emerald-50">
        <Link
          to="/"
          className="grow-0 shrink-0 mb-2 self-start pb-1 px-1 mx-1.5 pt-1.5 w-auto inline-block transition-colors duration-200 border-gray-400 hover:border-amber-400 dark:border-gray-700 hover:dark:border-amber-700"
        >
          <svg
            viewBox="0 0 342 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-[18px]"
          >
            <title>Mainframe</title>
            <path
              d="M53.0638 34.6C53.0638 39.08 53.1278 41.192 54.2798 42.792C55.9438 45.096 56.3918 45.928 56.3278 47.08C56.1998 48.424 55.3038 49 53.3838 49C53.2558 49 40.7118 49 40.5838 49C38.6638 49 37.7678 48.424 37.6398 47.08C37.5758 45.928 38.0238 45.096 39.6878 42.792C40.8398 41.192 40.9038 39.08 40.9038 34.6V18.536C37.0638 27.752 32.2638 39.336 31.2397 41.832C29.3838 46.312 28.6798 49 25.0318 49C22.0878 49 20.6798 46.184 19.4638 42.984C18.7598 41.128 13.8958 28.584 9.67175 18.216V34.6C9.67175 39.08 9.79975 41.192 10.9518 42.792C12.6158 45.096 13.1278 45.928 13.0638 47.08C12.9358 48.424 12.0398 49 10.0558 49C9.92775 49 3.46375 49 3.33575 49C1.35175 49 0.45575 48.424 0.32775 47.08C0.26375 45.928 0.71175 45.096 2.37575 42.792C3.52775 41.192 3.65575 39.08 3.65575 34.6V18.6C3.65575 14.184 3.52775 12.072 2.37575 10.408C0.71175 8.104 0.26375 7.336 0.32775 6.184C0.45575 4.84 1.35175 4.2 3.33575 4.2C3.46375 4.2 10.6318 4.2 13.3198 4.2C16.0078 4.2 17.7998 4.904 18.9518 7.912C20.2958 11.56 28.2318 33.192 28.2318 33.192C28.2318 33.192 37.1278 12.136 38.8558 8.168C40.0718 5.288 40.9038 4.2 44.3598 4.2C44.4878 4.2 53.2558 4.2 53.3838 4.2C55.3038 4.2 56.1998 4.84 56.3278 6.184C56.3918 7.336 55.9438 8.104 54.2798 10.408C53.1278 12.072 53.0638 14.184 53.0638 18.6V34.6ZM91.1133 41.384C92.7133 43.048 94.2493 42.792 94.1213 44.712C93.9933 47.464 90.4733 49.576 86.8893 49.576C82.1533 49.576 79.7213 48.232 78.6973 45.48C76.9693 48.168 74.3453 49.576 70.2493 49.576C63.3373 49.576 59.2413 45.992 59.2413 40.744C59.2413 32.232 67.0493 29.736 78.2493 29.736C78.2493 29.224 78.2493 28.84 78.2493 28.84C78.2493 25.256 78.0573 22.44 75.4973 22.056C73.6413 21.8 71.8493 22.312 71.0813 24.744C69.8653 28.648 67.3693 29.544 64.5533 28.584C62.8253 27.944 61.2253 25.896 62.3133 23.144C64.1693 18.28 70.6973 17.128 76.1373 17.128C84.9693 17.128 89.8973 21.096 89.8973 30.44V31.72C89.8973 36.136 89.7053 39.912 91.1133 41.384ZM78.6973 38.248C78.6973 36.968 78.6973 36.456 78.6973 35.688C78.6973 33.64 77.8653 33.576 75.6893 33.96C73.2573 34.344 71.2733 36.2 71.0813 39.016C70.9533 41.704 72.1693 43.624 74.9853 43.624C77.5453 43.624 78.6973 41.576 78.6973 38.248ZM112.067 42.792C113.731 45.096 114.179 45.928 114.115 47.08C113.987 48.424 113.091 49 111.171 49C111.043 49 98.9473 49 98.8193 49C96.8353 49 95.9393 48.424 95.8753 47.08C95.7473 45.928 96.2593 45.096 97.9233 42.792C99.0753 41.192 99.1393 39.08 99.1393 34.6C99.1393 30.184 99.0753 28.072 97.9233 26.472C96.2593 24.168 95.7473 23.336 95.8753 22.184C95.9393 20.84 96.8993 20.008 98.8193 19.368C100.803 18.728 104.579 17.576 105.283 17.384C108.931 16.36 110.851 18.088 110.851 21.672C110.851 23.208 110.851 28.84 110.851 34.6C110.851 39.08 110.915 41.192 112.067 42.792ZM104.067 14.376C100.099 14.376 96.8353 11.432 96.8353 7.72C96.8353 4.072 100.099 1.128 104.067 1.128C108.099 1.128 111.363 4.072 111.363 7.72C111.363 11.432 108.099 14.376 104.067 14.376ZM152.924 42.792C154.588 45.096 155.1 45.928 155.036 47.08C154.908 48.424 154.012 49 152.028 49C151.9 49 139.868 49 139.74 49C137.756 49 136.86 48.424 136.732 47.08C136.668 45.928 137.18 45.096 138.844 42.792C139.996 41.192 140.06 39.08 140.06 34.6V33.96C140.06 29.544 140.124 23.912 135.516 23.912C132.636 23.912 131.164 26.152 131.164 30.056C131.164 31.528 131.164 33.064 131.164 34.6C131.164 39.08 131.228 41.192 132.38 42.792C134.044 45.096 134.556 45.928 134.428 47.08C134.364 48.424 133.468 49 131.484 49C131.356 49 119.26 49 119.196 49C117.212 49 116.316 48.424 116.188 47.08C116.124 45.928 116.572 45.096 118.236 42.792C119.388 41.192 119.516 39.08 119.516 34.792C119.516 30.44 119.388 28.072 118.236 26.472C116.572 24.168 116.124 23.336 116.188 22.184C116.316 20.84 117.212 20.008 119.196 19.368C121.116 18.728 124.892 17.576 125.596 17.384C129.116 16.424 130.972 17.96 131.164 21.224C133.34 19.048 136.412 17.128 140.444 17.128C148.828 17.128 151.708 22.76 151.708 27.688C151.708 28.776 151.708 31.464 151.708 34.6C151.708 39.08 151.772 41.192 152.924 42.792ZM173.206 1.128C181.846 0.807999 185.302 6.76 183.446 10.6C181.91 13.864 175.894 13.48 175.318 9C174.87 5.864 174.102 4.456 172.246 4.52C170.71 4.584 169.942 5.864 169.878 7.592C169.878 10.984 172.246 13.16 173.078 17.64H178.71C180.054 17.64 181.206 18.728 181.206 20.136V20.712C181.206 22.12 180.054 23.208 178.71 23.208H173.398V34.6C173.398 39.08 173.27 41.32 174.614 42.792C176.406 44.712 177.302 45.864 177.11 47.08C176.918 48.36 176.15 49 174.166 49C170.006 49 161.494 49 161.43 49C159.446 49 158.55 48.424 158.422 47.08C158.358 45.928 158.806 45.096 160.47 42.792C161.622 41.192 161.75 39.08 161.75 34.6V23.208H158.23C156.886 23.208 155.734 22.12 155.734 20.712V20.136C155.734 18.728 156.886 17.64 158.23 17.64H161.43C160.598 5.48 165.27 1.384 173.206 1.128ZM204.653 17.128C211.501 17.128 214.061 22.76 211.501 27.368C209.773 30.376 205.101 31.144 202.669 27.88C200.941 25.576 201.325 23.464 199.149 23.464C197.549 23.464 197.165 24.68 197.101 26.728C197.101 29.032 197.101 31.784 197.101 34.6C197.101 39.08 197.165 41.512 198.317 42.792C200.109 44.648 201.005 45.864 200.813 47.08C200.621 48.36 199.853 49 197.869 49C197.549 49 185.197 49 185.133 49C183.149 49 182.253 48.424 182.125 47.08C182.061 45.928 182.509 45.096 184.173 42.792C185.325 41.192 185.389 39.08 185.389 34.792C185.389 30.44 185.325 28.072 184.173 26.472C182.509 24.168 182.061 23.336 182.125 22.184C182.253 20.84 183.149 20.008 185.133 19.368C187.053 18.728 190.829 17.576 191.533 17.384C194.733 16.488 196.589 17.704 196.973 20.456C198.701 18.6 201.133 17.128 204.653 17.128ZM243.426 41.384C245.026 43.048 246.562 42.792 246.434 44.712C246.306 47.464 242.786 49.576 239.202 49.576C234.466 49.576 232.034 48.232 231.01 45.48C229.282 48.168 226.658 49.576 222.562 49.576C215.65 49.576 211.554 45.992 211.554 40.744C211.554 32.232 219.362 29.736 230.562 29.736C230.562 29.224 230.562 28.84 230.562 28.84C230.562 25.256 230.37 22.44 227.81 22.056C225.954 21.8 224.162 22.312 223.394 24.744C222.178 28.648 219.682 29.544 216.866 28.584C215.138 27.944 213.538 25.896 214.626 23.144C216.482 18.28 223.01 17.128 228.45 17.128C237.282 17.128 242.21 21.096 242.21 30.44V31.72C242.21 36.136 242.018 39.912 243.426 41.384ZM231.01 38.248C231.01 36.968 231.01 36.456 231.01 35.688C231.01 33.64 230.178 33.576 228.002 33.96C225.57 34.344 223.586 36.2 223.394 39.016C223.266 41.704 224.482 43.624 227.298 43.624C229.858 43.624 231.01 41.576 231.01 38.248ZM304.572 42.792C306.236 45.096 306.748 45.928 306.62 47.08C306.556 48.424 305.66 49 303.676 49C303.548 49 291.452 49 291.388 49C289.404 49 288.508 48.424 288.38 47.08C288.316 45.928 288.764 45.096 290.428 42.792C291.58 41.192 291.644 39.08 291.644 34.6V33.96C291.644 29.544 292.348 23.912 287.74 23.912C284.86 23.912 283.26 26.152 283.26 30.056C283.26 31.336 283.26 32.936 283.26 34.6C283.26 39.08 283.324 41.192 284.476 42.792C286.14 45.096 286.588 45.928 286.524 47.08C286.396 48.424 285.5 49 283.516 49C283.452 49 271.356 49 271.228 49C269.244 49 268.348 48.424 268.284 47.08C268.156 45.928 268.668 45.096 270.332 42.792C271.484 41.192 271.548 39.08 271.548 34.6V33.96C271.548 29.544 272.252 23.912 267.644 23.912C264.764 23.912 263.1 26.152 263.1 30.056C263.1 31.528 263.1 33.064 263.1 34.6C263.1 39.08 263.164 41.192 264.38 42.792C266.044 45.096 266.492 45.928 266.428 47.08C266.3 48.424 265.404 49 263.42 49C263.356 49 251.26 49 251.132 49C249.148 49 248.252 48.424 248.188 47.08C248.06 45.928 248.572 45.096 250.236 42.792C251.388 41.192 251.452 39.08 251.452 34.6C251.452 30.184 251.388 28.072 250.236 26.472C248.572 24.168 248.06 23.336 248.188 22.184C248.252 20.84 249.212 20.008 251.132 19.368C253.116 18.728 256.892 17.576 257.596 17.384C261.116 16.424 262.972 17.96 263.1 21.288C265.34 19.112 268.476 17.128 272.636 17.128C277.948 17.128 280.828 19.432 282.172 22.376C284.412 19.88 287.932 17.128 292.732 17.128C301.116 17.128 303.356 22.76 303.356 27.688C303.356 28.776 303.356 31.464 303.356 34.6C303.356 39.08 303.42 41.192 304.572 42.792ZM337.424 39.528C339.28 37.736 341.072 39.144 339.984 41.512C338.064 45.864 333.712 49.576 326.16 49.576C317.264 49.576 308.432 44.52 308.048 33.768C307.728 22.76 316.24 16.744 325.84 17.128C335.248 17.384 339.728 23.912 340.24 29.16C340.688 33.448 339.92 35.112 335.824 35.112C332.688 35.112 320.016 35.112 320.016 35.112C321.552 43.304 332.24 44.584 337.424 39.528ZM324.88 22.312C322 22.504 320.656 25.448 320.08 28.136C319.888 28.84 320.208 29.48 320.784 29.48C322.32 29.48 327.12 29.48 328.272 29.48C329.808 29.48 330.512 28.392 330 26.472C329.552 24.616 328.464 21.992 324.88 22.312Z"
              fill="currentColor"
            />
          </svg>
        </Link>
        <section className="pt-8">
          <SidebarButton
            href="/projects"
            name={() => "Projects"}
            icon={<LayoutGridIcon className="relative w-5 h-5" />}
          />
          {!hideDashboard && (
            <SidebarButton
              href="/dashboard"
              name={() => "Dashboard"}
              icon={<LineChartIcon className="relative w-5 h-5" />}
            />
          )}
          <SidebarButton
            href="/new"
            isActive={(isActive) => isActive || !!isIndexPath}
            name={() => "New Dataset"}
            icon={
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
            }
          />
        </section>
        {(datasets ?? []).length > 0 ? (
          <section className="pt-4">
            <h2 className="opacity-50 text-sm px-1">Datasets</h2>
            <ul className="w-full flex-shrink flex-1">
              {(datasets ?? []).map((dataset) => {
                return (
                  <li key={dataset.id}>
                    <SidebarDatasetButton dataset={dataset} />
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
        <div className="flex-1" />
        <div className="flex gap-2">
          <button
            onClick={() => {
              logout.mutate();
            }}
            className={cn([
              "flex w-0 flex-1 items-center gap-1.5 p-2 rounded-lg",
              "text-sm text-slate-500 hover:text-slate-500",
              "hover:bg-slate-300/40",
            ])}
            disabled={logout.isLoading}
          >
            Logout{" "}
            <Loader2Icon
              className={cn(
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
            className={cn([
              "flex items-center justify-center gap-1.5 p-2 rounded-lg",
              "text-slate-400 hover:text-slate-900",
              "",
              "h-10 w-10 text-center",
            ])}
            onClick={() => {}}
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
  );
}

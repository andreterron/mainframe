import { createBrowserRouter } from "react-router-dom";

import AuthPage from "./webroutes/_auth";
import AuthLogin from "./webroutes/_auth.login";
import AuthLogout from "./webroutes/_auth.logout";
import AuthSignup from "./webroutes/_auth.setup";
import Dashboard from "./webroutes/_dashboard";
import DatasetDetails from "./webroutes/_dashboard.dataset.$id._index";
import DatasetObjectDetails from "./webroutes/_dashboard.dataset.$id.object.$object_id";
import DatasetTableDetails from "./webroutes/_dashboard.dataset.$id.table.$table_id";
import DatasetRowDetails from "./webroutes/_dashboard.row.$row_id";
import Index from "./webroutes/_dashboard._index";

export const router =
    typeof window !== "undefined"
        ? createBrowserRouter([
              {
                  element: <AuthPage />,
                  children: [
                      {
                          path: "/login",
                          element: <AuthLogin />,
                      },
                      {
                          path: "/logout",
                          element: <AuthLogout />,
                      },
                      {
                          path: "/setup",
                          element: <AuthSignup />,
                      },
                  ],
              },
              {
                  element: <Dashboard />,
                  children: [
                      {
                          path: "/",
                          element: <Index />,
                      },
                      {
                          path: "/dataset/:id",
                          element: <DatasetDetails />,
                      },
                      {
                          path: "/dataset/:id/object/:object_id",
                          element: <DatasetObjectDetails />,
                      },
                      {
                          path: "/dataset/:id/table/:table_id",
                          element: <DatasetTableDetails />,
                      },
                      {
                          path: "/row/:row_id",
                          element: <DatasetRowDetails />,
                      },
                  ],
              },
          ])
        : undefined;

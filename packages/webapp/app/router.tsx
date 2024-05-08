import { createBrowserRouter } from "react-router-dom";

import AuthPage from "./webroutes/_auth";
import AuthLogin from "./webroutes/_auth.login";
import AuthLogout from "./webroutes/_auth.logout";
import AuthSignup from "./webroutes/_auth.setup";
import AppPages from "./webroutes/_app";
import DatasetDetails from "./webroutes/_app.dataset.$id._index";
import DatasetObjectDetails from "./webroutes/_app.dataset.$id.object.$object_id";
import DatasetTableDetails from "./webroutes/_app.dataset.$id.table.$table_id";
import DatasetRowDetails from "./webroutes/_app.row.$row_id";
import NewPage from "./webroutes/_app.new";
import DatasetCredentials from "./webroutes/_app.dataset.$id.credentials";
import DashboardComponentPage from "./webroutes/_app.dashboard.$id";
import DashboardPage from "./webroutes/_app.dashboard._index";

export const router = createBrowserRouter([
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
    element: <AppPages />,
    children: [
      {
        path: "/",
        element: <NewPage />,
      },
      {
        path: "/new",
        element: <NewPage />,
      },
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      {
        path: "/dashboard/:id",
        element: <DashboardComponentPage />,
      },
      {
        path: "/dataset/:id",
        element: <DatasetDetails />,
      },
      {
        path: "/dataset/:id/credentials",
        element: <DatasetCredentials />,
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
]);

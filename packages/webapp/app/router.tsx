import { createBrowserRouter, Navigate, useParams } from "react-router-dom";

import AuthPage from "./webroutes/_auth";
import AuthLogin from "./webroutes/_auth.login";
import AuthLogout from "./webroutes/_auth.logout";
import AuthSignup from "./webroutes/_auth.setup";
import AppPages from "./webroutes/_app";
import AccountObjectDetails from "./webroutes/_app.accounts.$id.object.$object_id";
import AccountTableDetailsPage from "./webroutes/_app.accounts.$id.table.$table_id";
import DatasetRowDetails from "./webroutes/_app.row.$row_id";
import NewPage from "./webroutes/_app.new";
import AccountCredentials from "./webroutes/_app.accounts.$id.credentials";
import DashboardComponentPage from "./webroutes/_app.dashboard.$id";
import DashboardPage from "./webroutes/_app.dashboard._index";
import AccountComputed from "./webroutes/_app.accounts.$id.computed.$computed_id";
import { ConnectPage } from "./components/pages/ConnectPage";
import ProjectsPage from "./webroutes/_app.projects._index";
import ProjectDetailsPage from "./webroutes/_app.projects.$id";
import NewProjectPage from "./webroutes/_app.projects.new";
import AccountsPage from "./webroutes/_app.accounts._index";
import AccountDetailsPage from "./webroutes/_app.accounts.$id._index";
import { CreateAccountPage } from "./webroutes/_app.accounts.new.$service";
import ApisPage from "./webroutes/_app.apis._index";
import ApiServicePage from "./webroutes/_app.apis.$service";
import ApiSwaggerUiPage from "./webroutes/_app.apis.$service.swagger_ui";
import ApiServiceIndexPage from "./webroutes/_app.apis.$service._index";
import { RouterWrapper } from "./components/RouterWrapper";

export const router = createBrowserRouter([
  {
    element: <RouterWrapper />,
    children: [
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
      // Mainframe Connect flow
      {
        path: "/connect/:linkId",
        element: <ConnectPage />,
      },
      // Dashboard
      {
        element: <AppPages />,
        children: [
          {
            path: "/",
            element: <Navigate to="/accounts" replace />,
          },
          {
            path: "/accounts",
            element: <AccountsPage />,
          },
          {
            path: "/accounts/new",
            element: <NewPage />,
          },
          {
            path: "/accounts/new/:service",
            element: <CreateAccountPage />,
          },
          {
            path: "/accounts/:id",
            element: <AccountDetailsPage />,
          },
          {
            path: "/apis",
            element: <ApisPage />,
          },
          {
            path: "/apis/:service/endpoint/:endpoint_id",
            lazy: async () => {
              let { default: Component, apiEndpointLoader: loader } =
                await import(
                  "./webroutes/_app.apis.$service.endpoint.$endpoint_id"
                );

              return { loader, Component };
            },
          },
          {
            path: "/apis/:service",
            element: <ApiServicePage />,
            children: [
              {
                path: "",
                element: <ApiServiceIndexPage />,
              },
              {
                path: "swagger_ui",
                lazy: async () => ({
                  Component: (
                    await import("./webroutes/_app.apis.$service.swagger_ui")
                  ).default,
                }),
              },
            ],
          },
          {
            path: "/projects",
            element: <ProjectsPage />,
          },
          {
            path: "/projects/new",
            element: <NewProjectPage />,
          },
          {
            path: "/projects/:id",
            element: <ProjectDetailsPage />,
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
            path: "/accounts/:id/credentials",
            element: <AccountCredentials />,
          },
          {
            path: "/accounts/:id/object/:object_id",
            element: <AccountObjectDetails />,
          },
          {
            path: "/accounts/:id/table/:table_id",
            element: <AccountTableDetailsPage />,
          },
          {
            path: "/accounts/:id/computed/:computed_id",
            element: <AccountComputed />,
          },
          {
            path: "/row/:row_id",
            element: <DatasetRowDetails />,
          },
          // Renamed
          {
            path: "/new",
            element: <Navigate to="/accounts/new" replace />,
          },
          {
            path: "/dataset/*",
            element: <DatasetRedirect />,
          },
        ],
      },
    ],
  },
]);

function DatasetRedirect() {
  let params = useParams();
  let path = params["*"];

  return <Navigate to={`/accounts/${path}`} replace />;
}

import { useParams } from "react-router-dom";
import { trpc } from "../lib/trpc_client";
import { SadPath } from "../components/SadPath";
import { Link } from "react-router-dom";
import { DatasetHeader } from "../components/DatasetHeader";
import { getDatasetCredentialsKeys } from "../lib/data/credentials";
import { CheckIcon, FunctionSquareIcon, PencilIcon } from "lucide-react";
import { PreviewLabel } from "../components/PreviewLabel";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { z } from "zod";
import { PageBreadcrumb } from "../components/PageBreadcrumb";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";

export default function AccountDetailsPage() {
  const { id } = useParams();

  const {
    data: dataset,
    refetch,
    error: datasetError,
    isLoading: isDatasetLoading,
  } = trpc.datasetsGet.useQuery(
    {
      id: id ?? "",
    },
    { enabled: !!id },
  );
  const {
    data: integrations,
    error: integrationsError,
    isLoading: isIntegrationsLoading,
  } = trpc.integrationsAll.useQuery();

  const datasetsUpdate = trpc.datasetsUpdate.useMutation({
    onSettled() {
      refetch();
      utils.datasetsAll.invalidate();
    },
  });

  // Functions

  function setIntegrationType(integrationType: string) {
    if (!dataset || !id) {
      console.error("No doc to set integration type");
      return;
    }
    const integration = integrations?.[integrationType];
    if (!integration) {
      console.error("Integration not found for type", integrationType);
      return;
    }
    datasetsUpdate.mutate({
      id,
      patch: {
        integrationType,
        name: dataset.name ? undefined : integration.name,
      },
    });
  }

  const integration = dataset?.integrationType
    ? integrations?.[dataset.integrationType]
    : undefined;

  const [editingTitle, setEditingTitle] = useState(false);
  const utils = trpc.useUtils();

  if (!dataset || !integrations || !dataset.integrationType || !integration) {
    return (
      <SadPath
        className="p-4"
        error={datasetError ?? integrationsError ?? undefined}
        isLoading={isDatasetLoading || isIntegrationsLoading}
      />
    );
  }

  const { tables, objects, computed } = integration;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-8 items-start">
        <DatasetHeader
          dataset={dataset}
          breadcrumb={
            <PageBreadcrumb>
              <BreadcrumbItem>
                <BreadcrumbLink to={"/accounts"}>Accounts</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{dataset.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </PageBreadcrumb>
          }
        >
          {editingTitle ? (
            <form
              className="flex items-center"
              onSubmit={(e) => {
                e.preventDefault();
                const name = z
                  .string()
                  .optional()
                  .catch(undefined)
                  .parse(
                    new FormData(e.target as HTMLFormElement).get(
                      "datasetTitle",
                    ),
                  )
                  ?.trim();
                if (!name) {
                  setEditingTitle(false);
                  return;
                }
                utils.datasetsGet.setData(
                  { id: dataset.id },
                  { ...dataset, name },
                );
                datasetsUpdate.mutate({ id: dataset.id, patch: { name } });
                setEditingTitle(false);
              }}
            >
              <input
                id="dataset-title"
                name="datasetTitle"
                className="p-1 border-0 margin-0 ring-2 ring-primary ring-inset bg-muted rounded-md"
                placeholder="Cancel rename"
                autoFocus
                defaultValue={dataset.name}
              ></input>
              <Button variant="default" size="icon" className="ml-2">
                <CheckIcon className="w-4 h-4 inline" />
              </Button>
            </form>
          ) : (
            <span className="inline-block group pr-8 h-10">
              <span className="p-1 inline-block">{dataset.name}</span>
              <Button
                variant="ghost"
                className="ml-2 opacity-0 transition-opacity duration-75 group-hover:opacity-100 w-8 h-8"
                size="none"
                onClick={() => {
                  setEditingTitle((v) => !v);
                }}
              >
                <PencilIcon className="w-4 h-4 inline text-muted-foreground" />
              </Button>
            </span>
          )}
        </DatasetHeader>
        <div className="flex flex-col gap-1 p-4">
          {getDatasetCredentialsKeys(dataset.credentials).length > 0 ||
          dataset.credentials?.nangoIntegrationId ? (
            <Link
              to={`/accounts/${dataset.id}/credentials`}
              className="flex items-center gap-3 cursor-pointer select-none text-gray-900 bg-white focus:outline-none hover:bg-gray-100 active:bg-gray-200 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                className="humbleicons hi-document flex-grow-0 flex-shrink-0 w-5 h-5"
              >
                <path
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 14v2m-4-6V8a4 4 0 118 0v2m-9 9h10a1 1 0 001-1v-7a1 1 0 00-1-1H7a1 1 0 00-1 1v7a1 1 0 001 1z"
                />
              </svg>
              <span>Credentials</span>
            </Link>
          ) : null}
          {objects.map((obj) => (
            <Link
              to={`/accounts/${dataset.id}/object/${obj.id}`}
              key={obj.id}
              className="flex items-center gap-3 cursor-pointer select-none text-gray-900 bg-white focus:outline-none hover:bg-gray-100 active:bg-gray-200 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                className="humbleicons hi-document flex-grow-0 flex-shrink-0 w-5 h-5"
              >
                <g
                  xmlns="http://www.w3.org/2000/svg"
                  strokeLinejoin="round"
                  strokeWidth="2"
                >
                  <path d="M5 20V4a1 1 0 011-1h6.172a2 2 0 011.414.586l4.828 4.828A2 2 0 0119 9.828V20a1 1 0 01-1 1H6a1 1 0 01-1-1z" />
                  <path d="M12 3v6a1 1 0 001 1h6" />
                </g>
              </svg>
              <span>{obj.name}</span>
            </Link>
          ))}
          {tables.map((table) => (
            <Link
              to={`/accounts/${dataset.id}/table/${table.id}`}
              key={table.id}
              className="flex items-center gap-3 cursor-pointer select-none text-gray-900 bg-white focus:outline-none hover:bg-gray-100 active:bg-gray-200 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                className="humbleicons hi-database flex-grow-0 flex-shrink-0 w-5 h-5"
              >
                <g
                  xmlns="http://www.w3.org/2000/svg"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 12c0 1.657-3.582 3-8 3s-8-1.343-8-3M20 18c0 1.657-3.582 3-8 3s-8-1.343-8-3" />
                  <ellipse cx="12" cy="6" rx="8" ry="3" />
                  <path d="M4 6v12M20 6v12" />
                </g>
              </svg>
              <span>{table.name}</span>
            </Link>
          ))}
          {computed.map((fn) => (
            <div className="flex items-center gap-1" key={fn.id}>
              <Link
                to={`/accounts/${dataset.id}/computed/${fn.id}`}
                key={fn.id}
                className="flex items-center gap-3 cursor-pointer select-none text-gray-900 bg-white focus:outline-none hover:bg-gray-100 active:bg-gray-200 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700"
              >
                <FunctionSquareIcon className="flex-grow-0 flex-shrink-0 w-5 h-5" />
                <span>{fn.name}</span>
              </Link>
              <PreviewLabel />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

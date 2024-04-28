import { useParams } from "react-router-dom";
import { SadPath } from "../components/SadPath";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { DatasetBreadcrumb } from "../components/DatasetHeader.DatasetBreadcrumb";
import {
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import { trpc } from "../lib/trpc_client";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { useState } from "react";
import { getDatasetCredentialsKeys } from "../lib/data/credentials";

export function formatCredentialKey(str: string): string {
  return str
    .replace(/^[a-z]/, (c) => c.toUpperCase())
    .replaceAll(
      /([a-z])([A-Z])/g,
      (m, $1, $2: string) => `${$1} ${$2?.toLowerCase()}`,
    );
}

function HiddenReadonlyInput({ id, value }: { id: string; value: string }) {
  const [hidden, setHidden] = useState(true);
  return (
    <div className="flex w-full items-center space-x-2">
      <Input
        className="flex-1"
        id={id}
        type={hidden ? "password" : "text"}
        value={hidden ? "****************" : value}
        readOnly
      />
      <Button
        variant="outline"
        size="icon"
        className="shrink-0 grow-0"
        onClick={() => setHidden((h) => !h)}
      >
        {hidden ? (
          <EyeIcon className="w-4 h-4" />
        ) : (
          <EyeOffIcon className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}

export default function DatasetCredentials() {
  const { id: datasetId } = useParams();

  // return <div>Get your latest token</div>;

  // const { data, error, isLoading } = useObject(datasetId, objectId);

  const {
    data: dataset,
    refetch,
    error: datasetError,
    isLoading: isDatasetLoading,
  } = trpc.datasetsGet.useQuery(
    {
      id: datasetId ?? "",
    },
    { enabled: !!datasetId },
  );

  if (!dataset) {
    return (
      <SadPath
        className="p-4"
        error={datasetError}
        isLoading={isDatasetLoading}
      />
    );
  }

  //   const { dataset, object: objectData } = data;

  return (
    <div className="relative overflow-y-auto">
      <div className="flex flex-col items-start">
        <PageHeader
          title={"Credentials"}
          breadcrumb={
            <DatasetBreadcrumb dataset={dataset}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Credentials</BreadcrumbPage>
              </BreadcrumbItem>
            </DatasetBreadcrumb>
          }
        />
        <div className="w-full max-w-xl px-4 pb-4">
          {/* TODO: For nango, add a button to get the latest access token */}
          {getDatasetCredentialsKeys(dataset.credentials).map((key) => (
            <div className="w-full">
              <Label htmlFor={key}>{formatCredentialKey(key)}</Label>
              <HiddenReadonlyInput
                id={key}
                value={
                  dataset.credentials?.[
                    key as keyof typeof dataset.credentials
                  ] ?? ""
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

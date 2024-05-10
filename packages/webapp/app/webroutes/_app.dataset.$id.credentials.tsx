import { useParams } from "react-router-dom";
import { SadPath } from "../components/SadPath";
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  GlobeIcon,
  PlayIcon,
  UnlockIcon,
  LoaderIcon,
} from "lucide-react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { ApiRequestTab } from "../components/ApiRequestTab";
import { env } from "../lib/env_client";
import {
  WebStandardsPlaygroundTab,
  codeAtom,
} from "../components/WebStandardPlayground";
import { ScopeProvider } from "jotai-scope";
import {
  areaTemplate,
  positiveNegativeTemplate,
  positiveNegativeComposedTemplate,
} from "~/components/templates/templates";

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

function AccessTokenInput({ datasetId }: { datasetId: string }) {
  const getAccessToken = trpc.getAccessToken.useMutation();
  return (
    <div className="flex w-full items-center space-x-2">
      <Input
        className="flex-1"
        id="nangoAccessToken"
        type="text"
        value={getAccessToken.data ?? ""}
        readOnly
      />
      <Button
        variant="default"
        className="shrink-0 grow-0"
        onClick={() => getAccessToken.mutate({ datasetId })}
        disabled={getAccessToken.isLoading}
      >
        {getAccessToken.isLoading ? (
          <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UnlockIcon className="w-4 h-4 mr-2" />
        )}
        Get token
      </Button>
    </div>
  );
}

export default function DatasetCredentials() {
  const { id: datasetId } = useParams();

  const {
    data: dataset,
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

  // Replace the template variables
  const apiUrlString =
    env.VITE_API_URL === "https://api.mainframe.so"
      ? ""
      : `apiUrl: "${env.VITE_API_URL}",\n  `;

  // Replace placeholders in the code string, INPUT TEMPLATE HERE
  const appTsxCode = positiveNegativeComposedTemplate
    .replace("DATASET_ID_PLACEHOLDER", dataset.id)
    .replace("API_URL_PLACEHOLDER", apiUrlString);

  return (
    <ScopeProvider atoms={[codeAtom]}>
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
          <div className="w-full">
            <Tabs defaultValue="credentials" className="flex flex-col w-full">
              <TabsList className="grid grid-cols-3 m-4 self-start">
                <TabsTrigger value="credentials">
                  <LockIcon className="w-3.5 h-3.5 mr-1" />
                  Credentials
                </TabsTrigger>
                <TabsTrigger value="playground">
                  <PlayIcon className="w-3.5 h-3.5 mr-1" />
                  Playground
                </TabsTrigger>
                <TabsTrigger value="http">
                  <GlobeIcon className="w-3.5 h-3.5 mr-1" />
                  HTTP
                </TabsTrigger>
              </TabsList>
              <TabsContent value="credentials">
                <div className="w-full max-w-xl px-4 pb-4">
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
                  {dataset.credentials?.nangoIntegrationId ? (
                    <div className="w-full">
                      <Label htmlFor={"nangoIntegrationId"}>Access Token</Label>
                      <AccessTokenInput datasetId={dataset.id} />
                    </div>
                  ) : null}
                </div>
              </TabsContent>
              <TabsContent value="http" className="p-4">
                <ApiRequestTab apiPath={`credentials/${dataset.id}`} />
              </TabsContent>
              <TabsContent value="playground" className="p-4">
                <WebStandardsPlaygroundTab
                  appTsxCode={`import { useMainframeCredentials } from "@mainframe-so/react";

// TODO: Get environment variables from your app
import { env } from "./env.ts";

export default function App(): JSX.Element {
  const { data } = useMainframeCredentials({
    datasetId: "${dataset.id}",
    apiKey: env.API_KEY,
    args: [],
    ${
      env.VITE_API_URL === "https://api.mainframe.so"
        ? ""
        : `apiUrl: "${env.VITE_API_URL}",\n  `
    }}, async (creds) => {
    // Use credentials to do something here
    return null;
  });

  return (<>
    <h1>Hello world!</h1>
    <pre>{JSON.stringify(data ?? null, null, 4)}</pre>
  </>);
}`}
                />
                {/* <WebStandardsPlaygroundTab appTsxCode={appTsxCode} /> */}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </ScopeProvider>
  );
}

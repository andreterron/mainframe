import { useParams } from "react-router-dom";
import { SadPath } from "../components/SadPath";
import { BracesIcon, GlobeIcon, PlayIcon } from "lucide-react";
import SyntaxHighlighter from "react-syntax-highlighter";
import codeStyleLight from "react-syntax-highlighter/dist/esm/styles/hljs/docco";
import { useObject } from "../lib/data/object";
import { PageHeader } from "../components/PageHeader";
import { DatasetBreadcrumb } from "../components/DatasetHeader.DatasetBreadcrumb";
import {
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { ApiRequestTab } from "../components/ApiRequestTab";
import {
  WebStandardsPlaygroundTab,
  codeAtom,
} from "../components/WebStandardPlayground";
import { env } from "../lib/env_client";
import { ScopeProvider } from "jotai-scope";

export default function DatasetObjectDetails() {
  const { id: datasetId, object_id: objectId } = useParams();

  const { data, error, isLoading } = useObject(datasetId, objectId);

  if (!data) {
    return (
      <SadPath
        className="p-4"
        error={error ?? undefined}
        isLoading={isLoading}
      />
    );
  }

  const { dataset, object: objectData } = data;

  return (
    <ScopeProvider atoms={[codeAtom]}>
      <div className="relative overflow-y-auto">
        <div className="flex flex-col items-start">
          <PageHeader
            title={objectData.name}
            breadcrumb={
              <DatasetBreadcrumb dataset={dataset}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{objectData.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </DatasetBreadcrumb>
            }
          />
          <div className="w-full">
            <Tabs defaultValue="json" className="flex flex-col w-full">
              <TabsList className="grid grid-cols-3 m-4 self-start">
                <TabsTrigger value="json">
                  <BracesIcon className="w-3.5 h-3.5 mr-1" />
                  JSON
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
              <TabsContent value="json">
                <pre className="whitespace-pre-wrap font-mono p-4">
                  <SyntaxHighlighter
                    customStyle={{
                      background: "transparent",
                    }}
                    language="json"
                    style={codeStyleLight}
                  >
                    {JSON.stringify(objectData.data, null, 4)}
                  </SyntaxHighlighter>
                </pre>
              </TabsContent>
              <TabsContent value="http" className="p-4">
                <ApiRequestTab
                  apiPath={`object/${dataset.id}/${objectData.objectType}`}
                />
              </TabsContent>
              <TabsContent value="playground" className="p-4">
                <WebStandardsPlaygroundTab
                  appTsxCode={`import { useMainframeObject } from "@mainframe-so/react";

// TODO: Get environment variables from your app
import { env } from "./env.ts";

export default function App(): JSX.Element {
  const { data } = useMainframeObject({
    datasetId: "${data.dataset.id}",
    objectType: "${data.object.objectType}",
    apiKey: env.API_KEY,
    ${
      env.VITE_API_URL === "https://api.mainframe.so"
        ? ""
        : `apiUrl: "${env.VITE_API_URL}",\n  `
    }});

  return (<>
    <h1>Hello world!</h1>
    <pre>{JSON.stringify(data ?? null, null, 4)}</pre>
  </>);
}`}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </ScopeProvider>
  );
}

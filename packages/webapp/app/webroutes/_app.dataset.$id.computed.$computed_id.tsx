import { useParams } from "react-router-dom";
import { useState } from "react";
import { LoaderIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { SadPath } from "../components/SadPath";
import { PageHeader } from "../components/PageHeader";
import { DatasetBreadcrumb } from "../components/DatasetHeader.DatasetBreadcrumb";
import {
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import { codeAtom } from "../components/WebStandardPlayground";
import { ScopeProvider } from "jotai-scope";
import { useComputed } from "../lib/data/computed";
import SyntaxHighlighter from "react-syntax-highlighter";
import codeStyleLight from "react-syntax-highlighter/dist/esm/styles/hljs/docco";
import { Input } from "../components/ui/input";

export default function DatasetComputed() {
  const [paramValues, setParamValues] = useState<Record<string, string>>();
  const routeParams = useParams();
  const datasetId = routeParams.id;
  const functionId = routeParams.computed_id;
  const {
    data: computed,
    error,
    isLoading,
    isFetching,
  } = useComputed(datasetId, functionId, paramValues);
  const dataset = computed?.dataset,
    name = computed?.name,
    params = computed?.params,
    data = computed?.data;

  if (!dataset || !data) {
    return (
      <SadPath
        className="p-4"
        error={error ?? undefined}
        isLoading={isLoading}
      />
    );
  }

  return (
    <ScopeProvider atoms={[codeAtom]}>
      <div className="relative overflow-y-auto">
        <div className="flex flex-col items-start">
          <PageHeader
            title={name}
            breadcrumb={
              <DatasetBreadcrumb dataset={dataset}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{name}</BreadcrumbPage>
                </BreadcrumbItem>
              </DatasetBreadcrumb>
            }
          />
          <form
            className="px-4"
            onSubmit={(e) => {
              e.preventDefault();
              const values = Object.fromEntries(
                Array.from(new FormData(e.target as any).entries()).filter(
                  (entry): entry is [string, string] =>
                    typeof entry[1] === "string",
                ),
              );
              console.log("VALUES", values);
              setParamValues(values);
            }}
          >
            {(params ?? []).map((param) => (
              <div className="mb-2">
                <Label htmlFor={param.key}>{param.label ?? param.key}</Label>
                <Input
                  placeholder={param.placeholder ?? param.key}
                  key={param.key}
                  name={param.key}
                />
              </div>
            ))}
            <Button disabled={paramValues && isFetching} className="mt-4">
              Fetch
              {paramValues && isFetching && (
                <>
                  {" "}
                  <LoaderIcon className="ml-2 h-4 w-4 animate-spin" />
                </>
              )}
            </Button>
          </form>
          <pre className="whitespace-pre-wrap font-mono p-4">
            <SyntaxHighlighter
              customStyle={{
                background: "transparent",
              }}
              language="json"
              style={codeStyleLight}
            >
              {JSON.stringify(data, null, 4)}
            </SyntaxHighlighter>
          </pre>
        </div>
      </div>
    </ScopeProvider>
  );
}

import { PageHeader } from "../components/PageHeader";
import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import { PageBreadcrumb } from "../components/PageBreadcrumb";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import { trpcProxyClient } from "../lib/trpc_client";
import { Button } from "../components/ui/button";
import { SadPath } from "../components/SadPath";
import { Input } from "../components/ui/input";
import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import Oas from "oas";
import { generateFromSchema } from "../utils/json-schema-generate";
import { cn } from "../lib/utils";
import { apiClient } from "../lib/api_client";
import { Dataset } from "../../../shared/src";
import { z } from "zod";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// TODO: Save requests as the user types them
// TODO: Request body: JSON-friendly editor
// TODO: Improve the "Use Example" button
// TODO: There's a log of useState and variables depending on having synchronous `oas`, which is now async

function randomKey() {
  return Math.random().toString(36).substring(2, 10);
}

const zRequestBodyType = z.enum(["none", "text"]);
type RequestBodyType = z.infer<typeof zRequestBodyType>;

export const apiEndpointLoader = async ({ params }: LoaderFunctionArgs) => {
  const serviceId = params.service;
  const endpointIdPathSegment = params.endpoint_id;
  if (!serviceId || !endpointIdPathSegment) {
    throw new Response("Not found", { status: 404 });
  }
  const endpointId = decodeURIComponent(endpointIdPathSegment);

  // TODO: Handle trpc errors
  // TODO: Use a cache for the integration if possible
  const [integration, accounts] = await Promise.all([
    trpcProxyClient.integration.query({ id: serviceId, includeOpenAPI: true }),
    trpcProxyClient.datasetsAll.query(),
  ]);

  const openApiSpec = integration.openApiSpec;

  if (!openApiSpec) {
    throw new Response("Not found", { status: 404 });
  }

  return {
    serviceId,
    endpointId,
    integration,
    accounts,
    openApiSpec,
  };
};

export default function ApiEndpointPage() {
  // const {
  //   data: integrations,
  //   isLoading,
  //   error,
  // } = trpc.integrationsAll.useQuery();
  // const params = useParams();
  // const serviceId = params.service;
  // const integration = serviceId ? integrations?.[serviceId] : undefined;

  // const {
  //   data: integration,
  //   isLoading,
  //   error,
  // } = trpc.integration.useQuery({
  //   id: params.service ?? "",
  //   includeOpenAPI: true,
  // });

  // const {
  //   data: accounts,
  //   isLoading: datasetsLoading,
  //   error: datasetsError,
  // } = trpc.datasetsAll.useQuery();

  const { serviceId, endpointId, accounts, integration, openApiSpec } =
    useLoaderData() as Awaited<ReturnType<typeof apiEndpointLoader>>;

  const oas = useMemo(() => {
    return new Oas(openApiSpec);
  }, [openApiSpec]);

  const operation = useMemo(
    () => (endpointId ? oas.getOperationById(endpointId) : undefined),
    [endpointId, oas],
  );

  const [method, setMethod] = useState(
    operation?.method.toUpperCase() ?? "GET",
  );
  const [bodyType, setBodyType] = useState<RequestBodyType>(
    method === "GET" || method === "HEAD" ? "none" : "text",
  );

  const serviceAccounts = useMemo(
    () => accounts?.filter((acc) => acc.integrationType === serviceId),
    [accounts, serviceId],
  );

  const [selectedAccount, setSelectedAccount] = useState<Dataset | undefined>(
    serviceAccounts?.[0],
  );

  useEffect(() => {
    let firstServiceAccount = serviceAccounts?.[0];
    if (!selectedAccount && firstServiceAccount) {
      setSelectedAccount(firstServiceAccount);
    }
  }, [!serviceAccounts?.length]);

  const definition = oas?.getDefinition();

  function buildBaseUrl() {
    // TODO: Non-standard
    // TODO: server.variables
    return definition
      ? definition.servers?.[0]?.url ??
          (definition.host
            ? `https://${definition.host}${definition.basePath ?? ""}`
            : "")
      : "";
  }

  const baseUrl = buildBaseUrl();

  const [url, setUrl] = useState(`${baseUrl}${operation?.path ?? ""}`);

  useEffect(() => {
    if (!url) {
      setUrl(buildBaseUrl());
    }
  }, [baseUrl, operation]);
  const headerParams = useMemo(
    () => operation?.getParameters().filter((f) => f.in === "header") ?? [],
    [operation],
  );
  const [headers, setHeaders] = useState<
    { id: string; key: string; value: string }[]
  >(
    (operation?.getHeaders().request ?? []).map((key) => {
      const param = headerParams.find((h) => h.name === key);
      const schema =
        param?.schema && !("$ref" in param.schema) ? param.schema : undefined;
      const value = param?.example ?? schema?.enum?.[0] ?? "";
      return { id: randomKey(), key, value };
    }),
  );
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddHeader = () => {
    setHeaders(headers.concat({ id: randomKey(), key: "", value: "" }));
  };

  const handleHeaderChange = (id: string, key: string, value: string) => {
    setHeaders((headersState) =>
      headersState.map((h) => (h.id === id ? { id, key, value } : h)),
    );
  };
  const handleDeleteHeader = (id: string) => {
    setHeaders((headersState) => headersState.filter((h) => h.id !== id));
  };

  const handleSendRequest = async () => {
    if (!selectedAccount) {
      console.error("Sending a request without a selected account");
      return;
    }
    setLoading(true);
    setResponse(null);

    try {
      const options: RequestInit = {
        method,
        headers: headers.map((h): [string, string] => [h.key, h.value]),
        credentials: "include",
      };

      if (method !== "GET" && method !== "HEAD") {
        options.body = body;
      }

      const proxyUrl = new URL(
        apiClient.api.proxy[":dataset_id"]["*"].$url({
          param: { dataset_id: selectedAccount.id },
        }),
      );

      const urlUrl = new URL(url);

      proxyUrl.pathname = proxyUrl.pathname.replace(/\/\*$/, urlUrl.pathname);
      proxyUrl.search = urlUrl.search;
      proxyUrl.hash = urlUrl.hash;

      const res = await fetch(proxyUrl, options);
      // TODO: Use a content-type parser
      if (res.headers.get("Content-Type")?.includes("application/json")) {
        const json = await res.json();
        setResponse(JSON.stringify(json, null, 4));
      } else {
        const text = await res.text();
        setResponse(text);
      }
    } catch (error) {
      setResponse(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const [bodyPreviewString, setBodyPreviewString] = useState("");

  useEffect(() => {
    async function foo() {
      if (!oas) {
        return;
      }

      await oas.dereference();

      let bodyPreview =
        operation?.getRequestBodyExamples()[0]?.examples[0]?.value ??
        operation?.getParameters().find((p) => p.in === ("body" as any))
          ?.example;
      const bodySchema = operation
        ?.getParameters()
        .find((p) => p.in === ("body" as any))?.schema;

      if (!bodyPreview && bodySchema) {
        bodyPreview = generateFromSchema(bodySchema);
      }

      setBodyPreviewString(
        bodyPreview ? JSON.stringify(bodyPreview, null, 4) : "",
      );
    }

    foo().catch((e) => console.error(e));
  }, [oas]);

  if (!integration || !operation || !accounts) {
    console.log("SAD", !integration, !operation, !accounts);
    return (
      <SadPath
        className="p-4"
        // error={error ?? datasetsError}
        // isLoading={isLoading || datasetsLoading}
      />
    );
  }

  return (
    <div className="flex flex-col items-start gap-4 pb-16">
      <div>
        <PageHeader
          className="pb-0"
          title={
            <span className="inline-flex items-center">
              <span>{operation.getSummary() || operation.path}</span>
            </span>
          }
          breadcrumb={
            <PageBreadcrumb>
              <BreadcrumbLink to={"/apis"}>
                <BreadcrumbPage>APIs</BreadcrumbPage>
              </BreadcrumbLink>
              <BreadcrumbSeparator />
              <BreadcrumbLink to={`/apis/${serviceId}`}>
                <BreadcrumbPage>{integration.name}</BreadcrumbPage>
              </BreadcrumbLink>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {operation.getSummary() || operation.path}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </PageBreadcrumb>
          }
        />

        <p className="px-4 text-muted-foreground pb-4">
          <ReactMarkdown className="prose" remarkPlugins={[remarkGfm]}>
            {operation.getDescription()}
          </ReactMarkdown>
        </p>
      </div>

      <div className="p-4 gap-4 grid grid-cols-1 w-full max-w-5xl">
        <div>
          {/* Account picker */}
          <h3 className="text-lg font-semibold mb-2">Account</h3>
          {/* TODO: Feels like it's missing the service logo */}
          {/* TODO: Use a better reference for the account */}
          {/* TODO: Connect new account from here */}
          <Select
            value={selectedAccount?.id}
            onValueChange={(id) =>
              setSelectedAccount(serviceAccounts?.find((acc) => acc.id === id))
            }
          >
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="No Accounts" />
            </SelectTrigger>
            <SelectContent>
              {serviceAccounts?.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Requester */}
        <div>
          <h3 className="text-lg font-semibold mb-2">URL</h3>
          <div className="flex space-x-2 mb-4">
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Enter URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-grow"
            />
            {/* TODO: Remove `|| !selectedAccount` if we allow users to
                send requests without the Mainframe proxy */}
            <Button
              onClick={handleSendRequest}
              disabled={loading || !selectedAccount}
            >
              {loading ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Headers</h3>
          {headers.map(({ id, key, value }) => (
            <div key={id} className="flex space-x-2 mb-2">
              <Input
                placeholder="Key"
                value={key}
                onChange={(e) => handleHeaderChange(id, e.target.value, value)}
              />
              <Input
                placeholder="Value"
                value={value}
                onChange={(e) => handleHeaderChange(id, key, e.target.value)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => handleDeleteHeader(id)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </Button>
            </div>
          ))}
          <Button onClick={handleAddHeader} variant="outline" size="sm">
            Add Header
          </Button>
        </div>

        <div className="mb-4 space-y-2">
          <div
            className={cn(
              "flex items-center mb-2",
              bodyPreviewString ? "justify-between" : "justify-start",
            )}
          >
            <h3 className="text-lg font-semibold mb-2">Request Body</h3>
            {bodyPreviewString ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  setBody(bodyPreviewString);
                }}
              >
                Use Example
              </Button>
            ) : null}
          </div>

          <Select
            value={bodyType}
            onValueChange={(v) => setBodyType(zRequestBodyType.parse(v))}
          >
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="Request body type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="text">Text</SelectItem>
            </SelectContent>
          </Select>
          {bodyType === "text" && (
            <Textarea
              placeholder={`${bodyPreviewString}` ?? "Enter request body"}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="font-mono whitespace-pre h-96"
              rows={5}
            />
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Response</h3>
          <Textarea
            value={response || ""}
            readOnly
            rows={10}
            className="font-mono"
          />
        </div>
      </div>
    </div>
  );
}

import { PropsWithChildren, useState, useEffect } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import codeStyleLight from "react-syntax-highlighter/dist/esm/styles/hljs/docco";
import { Button } from "./ui/button";
import {
  ClipboardIcon,
  CheckIcon,
  EyeOffIcon,
  EyeIcon,
  LoaderIcon,
} from "lucide-react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { trpc } from "../lib/trpc_client";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { env } from "../lib/env_client";

export function ApiRequestTab({ apiPath }: { apiPath: string }) {
  // TODO: Test the API

  const [copied, setCopied] = useState(false);
  const [copiedHeader, setCopiedHeader] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;
    if (copied) {
      timeout = setTimeout(() => {
        setCopied(false);
      }, 2500);
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [copied]);

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;
    if (copiedHeader) {
      timeout = setTimeout(() => {
        setCopiedHeader(false);
      }, 2500);
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [copiedHeader]);

  const apiUrl = `${env.VITE_API_URL}/api/${apiPath}`;

  const [showApiKey, setShowApiKey] = useState(false);

  const { data: apiKey, isInitialLoading } = trpc.getApiKey.useQuery(
    undefined,
    {
      enabled: showApiKey,
      retry: false,
    },
  );
  const [apiRequestEnabled, setApiRequestEnabled] = useState(false);

  const {
    data: apiResponse,
    isFetching,
    refetch,
  } = useQuery({
    enabled: apiRequestEnabled,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    queryKey: [apiUrl] as const,
    queryFn: async (ctx) => {
      const res = await fetch(ctx.queryKey[0], {
        credentials: "include",
      });

      const status = res.status;

      const body = res.ok
        ? JSON.stringify(await res.json(), null, 2)
        : await res.text();

      return { status, statusText: res.statusText, body, ok: res.ok };
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 items-start relative">
        <div className="absolute top-2 bottom-2 left-2 w-px bg-border" />
        <code className="relative font-mono font-semibold px-2 py-1 border rounded text-sm bg-background">
          GET
        </code>
        <ul className="relative flex flex-col items-start gap-3">
          <li className="flex flex-col items-start gap-1">
            <div className="relative rounded bg-muted px-3 py-2 font-mono text-xs flex items-center gap-3">
              <code>{apiUrl}</code>
              <CopyToClipboard text={apiUrl} onCopy={() => setCopied(true)}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-1 w-5 h-5 text-muted-foreground hover:text-black"
                >
                  {copied ? (
                    <CheckIcon className="w-3 h-3 text-green-700" />
                  ) : (
                    <ClipboardIcon className="w-3 h-3" />
                  )}
                </Button>
              </CopyToClipboard>
            </div>
          </li>
        </ul>
      </div>
      <div className="flex flex-col items-start gap-1">
        <span className="text-muted-foreground uppercase font-semibold text-xs">
          Header
        </span>
        <code className="relative flex items-center gap-2 rounded bg-muted px-2 h-8 font-mono text-xs">
          <span>Authorization: Bearer </span>
          {showApiKey && apiKey ? (
            <>
              <span>{apiKey}</span>
              <CopyToClipboard
                text={apiKey}
                onCopy={() => setCopiedHeader(true)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-1 w-5 h-5 text-muted-foreground hover:text-black"
                >
                  {copiedHeader ? (
                    <CheckIcon className="w-3 h-3 text-green-700" />
                  ) : (
                    <ClipboardIcon className="w-3 h-3" />
                  )}
                </Button>
              </CopyToClipboard>
              <Button
                variant="ghost"
                size="icon"
                className="p-1 w-5 h-5 text-muted-foreground hover:text-black"
                onClick={() => setShowApiKey(false)}
              >
                <EyeOffIcon className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="text-xs h-6 gap-3"
              disabled={isInitialLoading}
              onClick={() => setShowApiKey(true)}
            >
              {isInitialLoading ? (
                <LoaderIcon className="w-3 h-3 animate-spin" />
              ) : (
                <EyeIcon className="w-3 h-3" />
              )}{" "}
              Show API Key
            </Button>
          )}
        </code>
      </div>
      <div className="flex flex-col items-start gap-2">
        <div className="flex gap-2 items-center">
          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              !apiRequestEnabled ? setApiRequestEnabled(true) : refetch();
            }}
            disabled={isFetching}
          >
            Try it!
          </Button>
          {apiResponse && (
            <span
              className={clsx(
                "text-sm",
                apiResponse.ok ? "text-green-700" : "text-orange-700",
              )}
            >
              {apiResponse.statusText}
            </span>
          )}
        </div>
        {/* <div className="bg-muted rounded text-xs max-w-[720px] font-mono whitespace-pre-wrap p-2 max-h-60 overflow-auto"> */}
        {apiResponse && (
          <div className="text-xs">
            <SyntaxHighlighter
              customStyle={{
                padding: "0.5rem",
                borderRadius: "0.25rem",
                // width: "720px",
                // maxHeight: "15rem",
                background: "transparent",
                overflow: "auto",
              }}
              language={apiResponse.ok ? "json" : "text"}
              style={codeStyleLight}
            >
              {apiResponse.body}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    </div>
  );
}

import { useNavigate, useParams } from "react-router-dom";
import Oas from "oas";
import { memo, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Command, CommandEmpty, CommandInput } from "../components/ui/command";
import { useCommandState, Command as CommandPrimitive } from "cmdk";
import { Card } from "../components/ui/card";
import { cn } from "../lib/utils";
import reactStringReplace from "react-string-replace";
import { trpc } from "../lib/trpc_client";
import { SadPath } from "../components/SadPath";

// TODO: Stop using cmdk. It might be the reason it's slow
// TODO: Add a `loader`
// TODO: Bump exact matches to the top. e.g.: GitHub `/user`
// TODO: Search other fields (description, response body, request body)
// TODO: Search with AI / semantic search
// TODO: <CommandGroup>
// TODO: Format variables

function normalizePath(path: string) {
  return path.replace(/^\s*\//, "").replace(/\/\s*$/, "");
}

export default function ApiServiceIndexPage() {
  return (
    <div className="px-4 w-full max-w-4xl">
      <Command shouldFilter={false}>
        <Card className="max-w-xl">
          <CommandInput placeholder="Type a path or search..."></CommandInput>
        </Card>
        <SearchItems />
      </Command>

      {/* TODO: Suggestions below the input while it's empty */}
    </div>
  );
}

function SearchItems() {
  const search: string = useCommandState((state) => state.search);

  const params = useParams();

  const {
    data: integration,
    isLoading,
    error,
  } = trpc.integration.useQuery({
    id: params.service ?? "",
    includeOpenAPI: true,
  });

  const oas = useMemo(() => {
    if (!integration?.openApiSpec) {
      return undefined;
    }
    return new Oas(integration?.openApiSpec);
  }, [integration?.openApiSpec]);
  const navigate = useNavigate();

  const pathMap = oas?.getPaths() ?? {};
  const paths = Object.keys(pathMap);

  const endpoints = useMemo(() => {
    return paths
      .flatMap((p) => {
        const path = pathMap[p];
        if (!path) {
          return null;
        }

        const methods = Object.keys(path) as (keyof typeof path)[];
        return methods.map((method) => {
          const endpoint = path[method];
          if (!endpoint) {
            return null;
          }
          const key = `${endpoint.method} ${endpoint.path}`;
          const description = endpoint.getSummary();
          const normalizedPath = normalizePath(endpoint.path);
          return {
            endpoint,
            key,
            description,
            value: `${key} ${description}`,
            path: normalizedPath,
            segments: normalizedPath.split("/").filter(Boolean),
          };
        });
      })
      .filter(Boolean);
  }, [paths]);

  const filteredEndpoints = useMemo(() => {
    if (!search) {
      return endpoints;
    }

    const exactSearch = normalizePath(search);
    // TODO: Improve endpoint matching algorithm
    // TODO: Try segment exact matching again
    // const searchSegments = exactSearch.split("/").filter(Boolean);
    return endpoints
      .filter(({ value }) => {
        if (!search) {
          return true;
        }
        return value.toLowerCase().includes(search.toLowerCase());
      })
      .map((obj) => {
        let rank = 0;
        if (obj.path === exactSearch) {
          rank = 2;
          // } else if (searchSegments[0]) {
          //   const i0 = obj.segments.indexOf(searchSegments[0]);
          //   for (let i = 0; i < searchSegments.length; i++) {
          //     if (searchSegments[i] !== obj.segments[i0 + i]) {
          //       break;
          //     }

          //     if (i === searchSegments.length - 1) {
          //       rank = 1;
          //     }
          //   }
        }
        return {
          ...obj,
          rank,
        };
      })
      .sort((a, b) => {
        return b.rank - a.rank;
      });
  }, [endpoints, search]);

  if (!integration) {
    return <SadPath error={error} isLoading={isLoading} />;
  }

  return (
    <CommandPrimitive.List className="py-4">
      <CommandEmpty>No results found.</CommandEmpty>

      {filteredEndpoints.map(({ endpoint, key, value, description }, i) => {
        const upateWait = Math.floor(i / 10) * 50;

        return (
          <CommandPrimitive.Item
            key={key}
            value={value}
            // className="font-mono mb-1 relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
            className={cn(
              "mb-1 relative py-1 px-2 data-[selected='true']:bg-accent/70 data-[selected=true]:text-accent-foreground rounded",
              "cursor-pointer",
              "flex items-center gap-2",
            )}
            onSelect={(v) => {
              navigate(
                `./endpoint/${encodeURIComponent(endpoint.getOperationId())}`,
                {
                  preventScrollReset: true,
                },
              );
            }}
          >
            <div className="w-14 flex items-center justify-center shrink-0">
              <span
                className={cn(
                  "text-xs px-1 py-0.5 rounded-md bg-accent opacity-70",
                  endpoint.method === "get"
                    ? "bg-green-100 text-green-600"
                    : endpoint.method === "post"
                    ? "bg-blue-100 text-blue-600"
                    : endpoint.method === "put"
                    ? "bg-purple-100 text-purple-600"
                    : endpoint.method === "patch"
                    ? "bg-orange-100 text-orange-600"
                    : endpoint.method === "delete"
                    ? "bg-red-100 text-red-600"
                    : endpoint.method === "head"
                    ? "bg-teal-100 text-teal-600"
                    : endpoint.method === "options"
                    ? "bg-gray-100 text-gray-600"
                    : endpoint.method === "trace"
                    ? "bg-pink-100 text-pink-600"
                    : "",
                )}
              >
                {endpoint.method}
              </span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm">
                <Highlighted
                  search={search}
                  className="underline"
                  text={description}
                  wait={upateWait}
                />
              </span>
              <span className="whitespace-pre font-mono ">
                <span className="text-xs text-muted-foreground">
                  <Highlighted
                    search={search}
                    text={endpoint.path}
                    wait={upateWait}
                  />
                </span>
              </span>
            </div>
          </CommandPrimitive.Item>
        );
      })}
    </CommandPrimitive.List>
  );
}

const Highlighted = memo(
  ({
    search,
    text,
    className,
    wait,
  }: {
    search: string;
    text: string;
    className?: string;
    wait: number;
  }) => {
    const lastEdit = useRef<number | undefined>();
    const timeout = useRef<NodeJS.Timeout | undefined>();
    const [cached, setCached] = useState<string | ReactNode[]>(text);

    useEffect(() => {
      setCached(text);
    }, [text]);

    useEffect(() => {
      lastEdit.current = Date.now();
      if (!search) {
        return;
      }
      // TODO: Don't create one timeout per row
      timeout.current = setTimeout(() => {
        if (
          lastEdit.current &&
          Date.now() >= lastEdit.current + wait &&
          search
        ) {
          setCached(
            reactStringReplace(text, search, (match, i) => (
              <span
                className={className ?? "font-bold underline"}
                key={match + i}
              >
                {match}
              </span>
            )),
          );
        }
      }, wait);
      return () => {
        if (timeout.current) {
          clearTimeout(timeout.current);
        }
      };
    }, [text, search, wait, className]);

    if (!search) {
      return text;
    }

    return cached;
  },
);

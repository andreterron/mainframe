import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as esbuild from "esbuild-wasm";
import { once } from "lodash";
import wasmURL from "esbuild-wasm/esbuild.wasm?url";
import { trpc } from "../lib/trpc_client";
import indexHtml from "../playground/index.html?raw";
import playgroundTsx from "../playground/playground.tsx.txt?raw";
import { env } from "../lib/env_client";

const initOnce = once(async () => {
  // @ts-ignore
  if (esbuild["__initialized__"]) {
    return;
  }
  // @ts-ignore
  esbuild["__initialized__"] = true;
  await esbuild.initialize({
    wasmURL,
  });
});

const loader: { [ext: string]: esbuild.Loader } = {
  ".tsx": "tsx",
  ".ts": "ts",
  ".js": "js",
  ".jsx": "jsx",
};

function envCode(apiKey: string) {
  return `export const env = ${JSON.stringify({ API_KEY: apiKey })}`;
}

export function useComponentPreview(initialCode: string) {
  const [code, setCode] = useState(initialCode);
  const [codeExecuted, setCodeExecuted] = useState(initialCode);
  const codeRef = useRef(code);
  // TODO: Cache the build output. So we don't need to build on iframe onload
  // const buildOutputRef = useRef<string | undefined>();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const abortSignalRef = useRef<AbortController>();
  const { data: apiKey } = trpc.getApiKey.useQuery(undefined, {
    retry: false,
  });

  const buildCode = useCallback(
    (code: string) => {
      const iframe = iframeRef.current;
      if (iframe) {
        abortSignalRef.current?.abort();
        const abortController = new AbortController();
        abortSignalRef.current = abortController;

        return codePipeline(code, apiKey, iframeRef, abortController.signal)
          .then((resultingCode) => {
            if (resultingCode !== undefined) {
              setCodeExecuted(resultingCode);
            }
          })
          .catch((e) => console.error(e));
      }
    },
    [apiKey, iframeRef],
  );

  useEffect(() => {
    buildCode(codeRef.current);
  }, [buildCode]);

  const dirty = useMemo(() => code !== codeExecuted, [code, codeExecuted]);

  const run = useCallback(() => buildCode(codeRef.current), [buildCode]);

  const iframe = useMemo(() => {
    // TODO: These are the sandboxing parameters from observable. Consider
    //       adding them.
    // sandbox="allow-downloads allow-forms allow-popups-to-escape-sandbox allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
    // allow="accelerometer; autoplay; clipboard-write; camera; encrypted-media; fullscreen; geolocation; gyroscope; magnetometer; microphone; midi"
    return (
      <iframe
        ref={iframeRef}
        onLoad={() => {
          buildCode(codeRef.current);
        }}
        // TODO: Customize iframe styles
        className="w-full flex-1 min-h-0 h-full"
        sandbox="allow-scripts"
        srcDoc={indexHtml.replace(
          `"https://app.mainframe.so"`,
          `"${env.VITE_APP_URL}"`,
        )}
      />
    );
  }, [indexHtml, buildCode]);

  return {
    codeRef,
    code,
    setCode: (code: string) => {
      codeRef.current = code;
      setCode(code);
    },
    iframe,
    run,
    dirty,
  };
}

async function codePipeline(
  code: string,
  apiKey: string | null | undefined,
  iframeRef: React.MutableRefObject<HTMLIFrameElement | null>,
  signal: AbortSignal,
) {
  await initOnce();
  if (signal.aborted) {
    return;
  }
  const files = new Map<string, string>();
  files.set("/App.tsx", code);
  files.set("/env.ts", envCode(apiKey ?? ""));
  const result = await esbuild.build({
    stdin: {
      contents: playgroundTsx,
      loader: "tsx",
      sourcefile: "/index.tsx",
    },
    jsx: "automatic",
    loader,
    bundle: true,
    format: "esm",
    tsconfigRaw: `{
        "compilerOptions": {
        }
      }`,
    // supported: {
    //   "inline-script": false,
    //   "inline-style": false,
    // },

    // target: target.value.toLowerCase(),
    // format: format.value === 'Preserve' ? void 0 : format.value.toLowerCase(),
    // minifySyntax: minifySyntax.checked,
    // minifyIdentifiers: minifyIdents.checked,
    // minifyWhitespace: minifySpaces.checked,
    // charset: ascii.checked ? 'ascii' : 'utf8',
    // keepNames: keepNames.checked,
    // mangleProps: mangleProps.checked ? /_$/ : void 0,
    plugins: [
      {
        name: "external-all",
        setup(build) {
          build.onLoad({ filter: /.*/ }, (args) => {
            if (files.has(args.path)) {
              const contents = files.get(args.path);
              return { contents, loader: "tsx" as esbuild.Loader };
            }
            return undefined;
          });
          build.onResolve({ filter: /.*/ }, async (args) => {
            const resolved = args.path.replace(/^\.{1,2}\//, "/");
            if (files.has(resolved)) {
              return { path: resolved };
            }
            return {
              path: args.path.match(/^https?:\/\//)
                ? args.path
                : `https://esm.sh/${args.path}`,
              external: true,
            };
          });
        },
      },
    ],
  });

  if (signal.aborted) {
    return;
  }

  const output =
    result.outputFiles?.at(0)?.text ?? JSON.stringify(result, null, 4);

  iframeRef.current?.contentWindow?.postMessage(
    { type: "script", value: output },
    "*",
  );

  return code;
}

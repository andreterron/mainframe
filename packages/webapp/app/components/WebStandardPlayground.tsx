import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "./ui/card";
import * as esbuild from "esbuild-wasm";
import { once } from "lodash";
import wasmURL from "esbuild-wasm/esbuild.wasm?url";
import { trpc } from "../lib/trpc_client";
import playgroundTsx from "../playground/playground.tsx.txt?raw";
import indexHtml from "../playground/index.html?raw";
import CodeMirror, { ViewUpdate } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import "../codemirror.css";
import { tomorrow } from "thememirror";
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

export const WebStandardsPlaygroundTab = memo(function ({
  appTsxCode,
}: {
  appTsxCode: string;
}) {
  const [code, setCode] = useState(appTsxCode);
  const codeRef = useRef(code);
  const { data: apiKey } = trpc.getApiKey.useQuery(undefined, {
    retry: false,
  });

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const abortSignalRef = useRef<AbortController>();

  const buildCode = useCallback(
    (code: string) => {
      const iframe = iframeRef.current;
      if (iframe) {
        abortSignalRef.current?.abort();
        const abortController = new AbortController();
        abortSignalRef.current = abortController;

        codePipeline(code, apiKey, iframeRef, abortController.signal).catch(
          (e) => console.error(e),
        );
      }
    },
    [apiKey, iframeRef],
  );

  useEffect(() => {
    buildCode(codeRef.current);
  }, [buildCode]);

  const handleChange = useCallback(
    (value: string, _viewUpdate: ViewUpdate) => {
      codeRef.current = value;
      setCode(value);
      buildCode(value);
    },
    [setCode],
  );

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
        className="h-full w-full"
        sandbox="allow-scripts"
        srcDoc={indexHtml.replace(
          `"https://app.mainframe.so"`,
          `"${env.VITE_APP_URL}"`,
        )}
      />
    );
  }, [indexHtml, buildCode]);

  return (
    <>
      <Card className="grid grid-cols-2 grid-rows-1 h-[480px] divide-x">
        <CodeMirror
          className="font-mono rounded-l-lg overflow-hidden playground"
          value={code}
          height="100%"
          extensions={[javascript({ jsx: true, typescript: true })]}
          onChange={handleChange}
          basicSetup={{
            foldGutter: false,
            lineNumbers: false,
            autocompletion: false,
            highlightActiveLine: false,
          }}
          theme={tomorrow}
        />

        {iframe}
      </Card>

      {/* <pre>{output}</pre> */}
    </>
  );
});

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
}

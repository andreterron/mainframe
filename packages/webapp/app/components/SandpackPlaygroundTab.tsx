import { memo, useMemo } from "react";
import {
  Sandpack,
  SandpackFiles,
  SandpackProvider,
} from "@codesandbox/sandpack-react";
import { trpc } from "../lib/trpc_client";
// NOTE: Don't fix the comment/uncomment for local dependencies yet. This
//       will change if we switch to web-standards imports.
// NOTE: Uncomment the imports below for local dependencies
// import mainframeReactRaw from "../../../react/dist/index?raw";
// import mainframeReactPkgJsonRaw from "../../../react/package.json";

// TODO: Typescript https://codesandbox.io/p/sandbox/github/danilowoz/sandpack-tsserver/tree/main/?file=/src/sandpack-components/codemirror-extensions.ts

function envCode(apiKey: string) {
  return `export const env = ${JSON.stringify({ API_KEY: apiKey })}`;
}

export const SandpackPlaygroundTab = memo(function ({
  appTsxCode,
}: {
  appTsxCode: string;
}) {
  return (
    <SandpackProvider template="react-ts">
      <SandpackClient appTsxCode={appTsxCode} />
    </SandpackProvider>
  );
});

export function SandpackClient({ appTsxCode }: { appTsxCode: string }) {
  const { data: apiKey } = trpc.getApiKey.useQuery(undefined, {
    retry: false,
  });
  const files = useMemo<SandpackFiles | undefined>(
    () =>
      !apiKey
        ? undefined
        : {
            "App.tsx": appTsxCode,
            // TODO: Move secrets to a login
            "env.ts": {
              hidden: true,
              code: envCode(apiKey ?? ""),
            },
            // NOTE: Uncomment the packages below for local dependencies
            // "/node_modules/@mainframe-so/react/dist/index.js":
            //   mainframeReactRaw,
            // "/node_modules/@mainframe-so/react/package.json": JSON.stringify({
            //   name: "@mainframe-so/react",
            //   main: "./dist/index.js",
            // }),
          },
    [appTsxCode, apiKey],
  );

  return (
    <div>
      {files ? (
        <Sandpack
          customSetup={{
            dependencies: {
              // NOTE: Comment the packages below for local dependencies
              "@mainframe-so/react": "^0.4.19",
              // NOTE: Uncomment the packages below for local dependencies
              // ...mainframeReactPkgJsonRaw.dependencies,
            },
          }}
          options={{
            editorHeight: "480px",
            showTabs: false,
          }}
          files={files}
          template="react-ts"
        />
      ) : null}
    </div>
  );
}

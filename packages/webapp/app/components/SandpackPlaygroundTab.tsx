import { useEffect, useState } from "react";
import {
  Sandpack,
  SandpackFiles,
  SandpackProvider,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { env } from "../lib/env_client";
import { trpc } from "../lib/trpc_client";
// TODO: Move to use npm's package
import mainframeReactRaw from "../../../react/dist/index?raw";
import mainframeReactPackageJsonRaw from "../../../react/package.json";

// TODO: Typescript https://codesandbox.io/p/sandbox/github/danilowoz/sandpack-tsserver/tree/main/?file=/src/sandpack-components/codemirror-extensions.ts

function envCode(apiKey: string) {
  return `export const env = ${JSON.stringify({ API_KEY: apiKey })}`;
}

export function SandpackPlaygroundTab({
  datasetId,
  objectType,
}: {
  datasetId: string;
  objectType: string;
}) {
  return (
    <SandpackProvider template="react-ts">
      <SandpackClient datasetId={datasetId} objectType={objectType} />
    </SandpackProvider>
  );
}

export function SandpackClient({
  datasetId,
  objectType,
}: {
  datasetId: string;
  objectType: string;
}) {
  const { data: apiKey, isInitialLoading } = trpc.getApiKey.useQuery(
    undefined,
    {
      retry: false,
    },
  );
  const [files] = useState<SandpackFiles>({
    "App.tsx": `import { useMainframeObject } from "@mainframe-so/react";

// TODO: Get environment variables from your app
import { env } from "./env.ts";

export default function App(): JSX.Element {
  const { data } = useMainframeObject({
    datasetId: "${datasetId}",
    objectType: "${objectType}",
    apiUrl: "${env.VITE_API_URL}",
    apiKey: env.API_KEY
  });

  return (<>
    <h1>Hello world!</h1>
    <pre>{JSON.stringify(data, null, 4)}</pre>
  </>);
}`,
    // TODO: Move secrets to a login
    "env.ts": {
      hidden: true,
      code: envCode(apiKey ?? ""),
    },
    "/node_modules/@mainframe-so/react/package.json": {
      hidden: true,
      code: JSON.stringify({
        name: "@design-system",
        main: "./index.js",
      }),
    },
    "/node_modules/@mainframe-so/react/index.js": {
      hidden: true,
      code: mainframeReactRaw,
    },
  });

  const { sandpack } = useSandpack();

  useEffect(() => {
    sandpack.updateFile("env.ts", envCode(apiKey ?? ""));
  }, [apiKey]);

  return (
    <div>
      <Sandpack
        customSetup={{
          dependencies: mainframeReactPackageJsonRaw.dependencies,
        }}
        options={{
          editorHeight: "480px",
          showTabs: false,
        }}
        files={files}
        template="react-ts"
      />
    </div>
  );
}

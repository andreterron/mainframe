import { useMemo } from "react";
import {
  Sandpack,
  SandpackFiles,
  SandpackProvider,
} from "@codesandbox/sandpack-react";
import { env } from "../lib/env_client";
import { trpc } from "../lib/trpc_client";

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
  const { data: apiKey } = trpc.getApiKey.useQuery(undefined, {
    retry: false,
  });
  const files = useMemo<SandpackFiles | undefined>(
    () =>
      !apiKey
        ? undefined
        : {
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
          },
    [datasetId, objectType, apiKey],
  );

  return (
    <div>
      {files ? (
        <Sandpack
          customSetup={{
            dependencies: {
              "@mainframe-so/react": "^0.4.9",
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

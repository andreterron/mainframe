import { PropsWithChildren } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import codeStyle from "react-syntax-highlighter/dist/esm/styles/prism/okaidia";
import colors from "tailwindcss/colors";

const customStyle: React.CSSProperties | undefined = {
  padding: "1rem 0",
  borderRadius: "0.25rem",
  // width: "720px",
  // maxHeight: "15rem",
  // background: "transparent",
  overflow: "auto",
};

const lineStyle: React.CSSProperties | undefined = {
  width: "100%",
  display: "block",
  padding: "0 1rem",
};

const highlightedLineStyle: React.CSSProperties | undefined = {
  ...lineStyle,
  backgroundColor: `${colors.blue[700]}66`,
};

export function ProjectSetupInstructions({
  appId,
  children,
}: PropsWithChildren<{ appId: string }>) {
  // TODO: Get inspiration from tailwind, shadcn and other dev tools setups
  // TODO: Ensure this is also in our docs

  return (
    <div className="w-[80ch] space-y-4">
      {/* TODO: Copy button */}
      {/* TODO: Switch between npm, yarn, pnpm, bun */}
      <div className="flex gap-2 items-center">
        <div className="size-8 bg-secondary border rounded-full flex items-center justify-center">
          1
        </div>
        <h2 className="font-bold text-lg">Create project</h2>
      </div>

      <SyntaxHighlighter
        customStyle={{ ...customStyle, padding: "1rem" }}
        language={"bash"}
        style={codeStyle}
      >
        npm create vite@latest -- --template react-ts
      </SyntaxHighlighter>
      {/* TODO: Copy button */}
      <div className="flex gap-2 items-center !mt-10">
        <div className="size-8 bg-secondary border rounded-full flex items-center justify-center">
          2
        </div>
        <h2 className="font-bold text-lg">Install Mainframe client</h2>
      </div>

      <SyntaxHighlighter
        customStyle={{ ...customStyle, padding: "1rem" }}
        language={"bash"}
        style={codeStyle}
      >
        npm i @mainframe-api/react
      </SyntaxHighlighter>
      <div className="flex gap-2 items-center !mt-10">
        <div className="size-8 bg-secondary border rounded-full flex items-center justify-center">
          3
        </div>
        <h2 className="font-bold text-lg">Add MainframeProvider</h2>
      </div>
      {/* TODO: Copy button */}
      {/* TODO: Syntax highlight */}

      <SyntaxHighlighter
        customStyle={customStyle}
        language={"tsx"}
        style={codeStyle}
        wrapLines={true}
        showLineNumbers={true}
        lineNumberStyle={{ display: "none" }}
        lineProps={(lineNumber) => {
          if (lineNumber == 6 || lineNumber == 10 || lineNumber === 12) {
            return { style: highlightedLineStyle };
          }
          return { style: lineStyle };
        }}
      >
        {`// main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { MainframeProvider } from '@mainframe-api/react'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainframeProvider appId="${appId}">
      <App />
    </MainframeProvider>
  </React.StrictMode>,
)`}
      </SyntaxHighlighter>
      {/* <pre className="bg-black font-mono p-4 text-white rounded">
        
      </pre> */}
      <div className="flex gap-2 items-center !mt-10">
        <div className="size-8 bg-secondary border rounded-full flex items-center justify-center">
          4
        </div>
        <h2 className="font-bold text-lg">Initiate authentication</h2>
      </div>

      <SyntaxHighlighter
        customStyle={customStyle}
        language={"tsx"}
        style={codeStyle}
        wrapLines={true}
        showLineNumbers={true}
        lineNumberStyle={{ display: "none" }}
        lineProps={(lineNumber) => {
          if ([2, 6, 11, 12, 13].includes(lineNumber)) {
            return { style: highlightedLineStyle };
          }
          return { style: lineStyle };
        }}
      >
        {`// App.tsx
import { useConnection } from '@mainframe-api/react'
import './App.css'

function App() {
  const { connection, initiateAuth } = useConnection('github')

  return (
    <>
      <h1>Mainframe</h1>
      <button onClick={() => initiateAuth()}>
        {connection ? 'Connected ✓' : 'Connect to GitHub'}
      </button>
    </>
  )
}

export default App
`}
      </SyntaxHighlighter>

      <div className="flex gap-2 items-center !mt-10">
        <div className="size-8 bg-secondary border rounded-full flex items-center justify-center">
          5
        </div>
        <h2 className="font-bold text-lg">Access APIs</h2>
      </div>

      <SyntaxHighlighter
        customStyle={customStyle}
        language={"tsx"}
        style={codeStyle}
        wrapLines={true}
        showLineNumbers={true}
        lineNumberStyle={{ display: "none" }}
        lineProps={(lineNumber) => {
          if ([2, 8, 9, 17].includes(lineNumber)) {
            return { style: highlightedLineStyle };
          }
          return { style: lineStyle };
        }}
      >
        {`// App.tsx
import { useConnection, useRequest } from '@mainframe-api/react'
import './App.css'

function App() {
  const { connection, initiateAuth } = useConnection('github')

  // This makes a request to the GitHub API through a Mainframe proxy
  const { data } = useRequest(connection, '/user')

  return (
    <>
      <h1>Mainframe</h1>
      <button onClick={() => initiateAuth()}>
        {connection ? 'Connected ✓' : 'Connect to GitHub'}
      </button>
      {data && <p>Connected as @{data.login}</p>}
    </>
  )
}

export default App
`}
      </SyntaxHighlighter>
      {children}
    </div>
  );
}

import { PropsWithChildren } from "react";

export function ProjectSetupInstructions({
  appId,
  children,
}: PropsWithChildren<{ appId: string }>) {
  // TODO: Get inspiration from tailwind, shadcn and other dev tools setups
  // TODO: Ensure this is also in our docs

  return (
    <div className="w-[80ch] space-y-4">
      {/* TODO: Copy button */}
      <pre className="bg-black font-mono p-4 text-white rounded">
        npm i @mainframe-api/react
      </pre>
      {/* TODO: Copy button */}
      {/* TODO: Syntax highlight */}
      <pre className="bg-black font-mono p-4 text-white rounded">
        {`// App.tsx
import { HomePage } from "./components/pages/Home";
import { MainframeProvider } from "@mainframe-api/react";

function App() {
  return (
    <MainframeProvider
      config={{
        appId: "${appId}",
      }}
    >
      <HomePage />
    </MainframeProvider>
  );
}

export default App;`}
      </pre>
      {children}
    </div>
  );
}

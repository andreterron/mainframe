import { PropsWithChildren } from "react";
import { Label } from "./ui/label";

export function ProjectSetupInstructions({
  appId,
  children,
}: PropsWithChildren<{ appId: string }>) {
  // TODO: Get inspiration from tailwind, shadcn and other dev tools setups
  // TODO: Ensure this is also in our docs

  return (
    <div className="w-[80ch] space-y-4">
      {/* TODO: Copy button */}
      <div className="flex gap-2 items-center">
        <div className="size-8 bg-secondary border rounded-full flex items-center justify-center">
          1
        </div>
        <h2 className="font-bold text-lg">Install Mainframe client</h2>
      </div>
      <pre className="bg-black font-mono p-4 text-white rounded">
        npm i @mainframe-api/react
      </pre>
      <div className="flex gap-2 items-center !mt-10">
        <div className="size-8 bg-secondary border rounded-full flex items-center justify-center">
          2
        </div>
        <h2 className="font-bold text-lg">Add MainframeProvider</h2>
      </div>
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
      <div className="flex gap-2 items-center !mt-10">
        <div className="size-8 bg-secondary border rounded-full flex items-center justify-center">
          3
        </div>
        <h2 className="font-bold text-lg">Initiate authentication</h2>
      </div>
      <pre className="bg-black font-mono p-4 text-white rounded">
        {`// Home.tsx
import { useMainframeClient } from "@mainframe-api/react";

export function HomePage() {
  const mainframe = useMainframeClient();

  return (
    <div>
      <button
        onClick={() => {
          mainframe.initiateAuth("github");
        }}
      >
        GitHub
      </button>
    </div>
  );
}
`}
      </pre>
      {children}
    </div>
  );
}

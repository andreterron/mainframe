import { useParams } from "react-router-dom";
import { trpc } from "../lib/trpc_client";
import { SadPath } from "../components/SadPath";
import { ApiHelper } from "../components/ApiHelper";
import { Code2Icon } from "lucide-react";
import SyntaxHighlighter from "react-syntax-highlighter";
import codeStyleLight from "react-syntax-highlighter/dist/esm/styles/hljs/docco";

export default function DatasetObjectDetails() {
  const { id: datasetId, object_id: objectId } = useParams();

  const { data, error, isLoading } = trpc.getObjectAndDataset.useQuery({
    datasetId,
    objectId,
  });

  if (!data) {
    return (
      <SadPath
        className="p-4"
        error={error ?? undefined}
        isLoading={isLoading}
      />
    );
  }

  const { dataset, object: objectData } = data;

  return (
    <div className="flex flex-col relative max-h-screen overflow-y-auto">
      <div className="flex flex-col gap-8 items-start">
        <div className="flex w-full items-center p-4">
          <h1 className="text-2xl font-medium flex-1">{dataset.name}</h1>
          <ApiHelper apiPath={`object/${dataset.id}/${objectData.objectType}`}>
            <button className="ml-2 inline-flex justify-center rounded-md bg-black bg-opacity-0 p-1.5 text-sm font-medium hover:bg-opacity-5 data-[state=open]:bg-opacity-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-opacity-75">
              <Code2Icon className="h-4 w-4" />
            </button>
          </ApiHelper>
        </div>
        <div className="">
          <pre className="whitespace-pre-wrap font-mono p-4">
            <SyntaxHighlighter
              customStyle={{
                background: "transparent",
              }}
              language="json"
              style={codeStyleLight}
            >
              {JSON.stringify(objectData.data, null, 4)}
            </SyntaxHighlighter>
          </pre>
        </div>
      </div>
    </div>
  );
}

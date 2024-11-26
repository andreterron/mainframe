import { useParams } from "react-router-dom";
import { trpc } from "../lib/trpc_client";
import { SadPath } from "../components/SadPath";
import SyntaxHighlighter from "react-syntax-highlighter";
import codeStyleLight from "react-syntax-highlighter/dist/esm/styles/hljs/docco";
import { PageHeader } from "../components/PageHeader";
import { DatasetBreadcrumb } from "../components/DatasetHeader.DatasetBreadcrumb";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";

export default function DatasetRowDetails() {
  const { row_id: rowId } = useParams();
  const { data: row, error, isLoading } = trpc.getRow.useQuery({ rowId });

  if (!row) {
    return (
      <SadPath
        className="p-4"
        error={error ?? undefined}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="flex flex-col relative max-h-screen overflow-y-auto">
      <div className="flex flex-col items-start">
        <PageHeader
          title={"Row data"}
          breadcrumb={
            <DatasetBreadcrumb dataset={row.dataset}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  to={`/accounts/${row.dataset.id}/table/${row.table.key}`}
                >
                  {row.table.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Row data</BreadcrumbPage>
              </BreadcrumbItem>
            </DatasetBreadcrumb>
          }
        />
        <div className="">
          <pre className="whitespace-pre-wrap font-mono p-4">
            <SyntaxHighlighter
              customStyle={{
                background: "transparent",
              }}
              language="json"
              style={codeStyleLight}
            >
              {row.data === undefined
                ? "undefined"
                : JSON.stringify(row.data, null, 4)}
            </SyntaxHighlighter>
          </pre>
        </div>
      </div>
    </div>
  );
}

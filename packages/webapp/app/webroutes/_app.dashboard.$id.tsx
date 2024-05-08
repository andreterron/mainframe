import { useNavigate, useParams } from "react-router-dom";
import { trpc } from "../lib/trpc_client";
import { SadPath } from "../components/SadPath";
import { WebStandardsPlaygroundTab } from "../components/WebStandardPlayground";
import { PageHeader } from "../components/PageHeader";
import { PageBreadcrumb } from "../components/PageBreadcrumb";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import { Button } from "../components/ui/button";

export default function DashboardComponentPage() {
  const { id: componentId } = useParams();
  const navigate = useNavigate();

  const {
    data: component,
    error,
    isLoading,
  } = trpc.getComponent.useQuery(
    { componentId: componentId ?? "" },
    { enabled: !!componentId },
  );

  const deleteComponent = trpc.deleteComponent.useMutation();

  const initialCode = component?.code;

  // Functions

  const handleDelete = async () => {
    if (component && confirm("Delete component?")) {
      await deleteComponent.mutateAsync({ id: component.id });
      navigate("/dashboard");
    }
  };

  if (!component) {
    return (
      <SadPath
        className="p-4"
        error={error ?? undefined}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title={component?.name || "Component"}
        breadcrumb={
          <PageBreadcrumb>
            <BreadcrumbLink to="/dashboard">
              <BreadcrumbItem>Dashboard</BreadcrumbItem>
            </BreadcrumbLink>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Component</BreadcrumbItem>
          </PageBreadcrumb>
        }
      >
        <Button
          variant="ghost"
          size="icon"
          title="Delete"
          onClick={handleDelete}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            className="humbleicons hi-trash text-black w-5 h-5"
          >
            <path
              xmlns="http://www.w3.org/2000/svg"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 6l.934 13.071A1 1 0 007.93 20h8.138a1 1 0 00.997-.929L18 6m-6 5v4m8-9H4m4.5 0l.544-1.632A2 2 0 0110.941 3h2.117a2 2 0 011.898 1.368L15.5 6"
            />
          </svg>
        </Button>
      </PageHeader>
      <div className="px-4">
        {initialCode ? (
          <WebStandardsPlaygroundTab
            appTsxCode={component?.code ?? ""}
            componentId={component?.id}
          />
        ) : null}
      </div>
    </div>
  );
}

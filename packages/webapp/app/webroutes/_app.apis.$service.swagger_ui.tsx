import { useParams } from "react-router-dom";
import { APIList } from "../components/openapi/swagger-ui";
import { trpc } from "../lib/trpc_client";
import { SadPath } from "../components/SadPath";

export default function ApiSwaggerUiPage() {
  const params = useParams();

  const {
    data: integration,
    isLoading,
    error,
  } = trpc.integration.useQuery({
    id: params.service ?? "",
    includeOpenAPI: true,
  });

  if (!integration?.openApiSpec) {
    return <SadPath isLoading={isLoading} error={error} />;
  }

  return <APIList openApiSpec={integration.openApiSpec} />;
}

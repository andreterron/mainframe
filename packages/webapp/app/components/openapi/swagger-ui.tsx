import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export function APIList({ openApiSpec }: { openApiSpec: string }) {
  return <SwaggerUI spec={openApiSpec} />;
}

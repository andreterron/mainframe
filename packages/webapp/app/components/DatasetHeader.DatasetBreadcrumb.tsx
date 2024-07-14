import { PropsWithChildren } from "react";
import { Dataset } from "@mainframe-api/shared";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
} from "./ui/breadcrumb";
import { PageBreadcrumb } from "./PageBreadcrumb";

export function DatasetBreadcrumb({
  children,
  dataset,
}: PropsWithChildren<{
  dataset: Pick<Dataset, "id" | "name" | "integrationType">;
}>) {
  return (
    <PageBreadcrumb>
      <BreadcrumbItem>
        {children ? (
          <BreadcrumbLink to={`/dataset/${dataset.id}`}>
            {dataset.name}
          </BreadcrumbLink>
        ) : (
          <BreadcrumbPage>{dataset.name}</BreadcrumbPage>
        )}
      </BreadcrumbItem>
      {children}
    </PageBreadcrumb>
  );
}

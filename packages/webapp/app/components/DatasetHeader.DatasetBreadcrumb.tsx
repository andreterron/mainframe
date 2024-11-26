import { PropsWithChildren } from "react";
import { Dataset } from "@mainframe-api/shared";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
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
        <BreadcrumbLink to={`/accounts`}>Accounts</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        {children ? (
          <BreadcrumbLink to={`/accounts/${dataset.id}`}>
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

import { PageHeader } from "../components/PageHeader";
import { trpc } from "../lib/trpc_client";

import { Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { useComponentPreview } from "../components/ComponentPreview";

export function ComponentCard({
  component,
}: {
  component: { id: string; code: string };
}) {
  const { iframe } = useComponentPreview(component.code);

  return (
    <Link to={`/dashboard/${component.id}`}>
      <Card className="h-72 pointer-events-none">{iframe}</Card>
    </Link>
  );
}
export default function DashboardPage() {
  const { data: components } = trpc.getAllComponents.useQuery();

  return (
    <div className="flex flex-col items-start gap-4">
      <PageHeader title="Dashboard" />
      <div className="w-full grid md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 px-4 max-w-[100rem]">
        {components?.map((component) => (
          <ComponentCard key={component.id} component={component} />
        ))}
      </div>
    </div>
  );
}

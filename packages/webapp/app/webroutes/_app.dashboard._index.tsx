import { PageHeader } from "../components/PageHeader";
import { trpc } from "../lib/trpc_client";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { useComponentPreview } from "../components/useComponentPreview";
import { Button } from "~/components/ui/button";

export function ComponentCard({
  component,
}: {
  component: { id: string; code: string };
}) {
  const { iframe } = useComponentPreview(component.code);

  return (
    <div className="group">
      <div className="flex justify-end w-full opacity-0 group-hover:opacity-75 focus-within:opacity-75 transition-all px-2 mb-1">
        <Button asChild variant="ghost" size="none" className="py-px px-1.5">
          <Link
            to={`/dashboard/${component.id}`}
            className="text-xs text-muted-foreground hover:bg-active"
          >
            Edit
          </Link>
        </Button>
      </div>
      <Card className="h-72 overflow-hidden relative">{iframe}</Card>
    </div>
  );
}
export default function DashboardPage() {
  const { data: components } = trpc.getAllComponents.useQuery();

  return (
    <div className="flex flex-col items-start gap-4">
      <PageHeader title="Dashboard" />
      <div className="w-full grid md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-x-4 gap-y-3 px-4 max-w-[100rem]">
        {components?.map((component) => (
          <ComponentCard key={component.id} component={component} />
        ))}
      </div>
    </div>
  );
}

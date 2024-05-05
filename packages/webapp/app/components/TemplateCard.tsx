import { Link } from "react-router-dom";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function TemplateCard() {
  return (
    <Link to={`/template/github-stars`}>
      <Card className="">
        <div className="bg-gray-200 h-40 w-full rounded-t"></div>
        <CardHeader>
          <CardTitle>GitHub stars</CardTitle>
          <CardDescription>track your stars</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

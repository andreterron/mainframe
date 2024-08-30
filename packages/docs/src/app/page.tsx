import { redirect } from "next/navigation";
import { allPages } from "../components/posts";

export default function Home() {
  redirect(allPages[0].url);
}

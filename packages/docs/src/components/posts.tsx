import { allPosts, Post } from "contentlayer/generated";

export const allPages: (Post & { section: string })[] = [];

export const sections = [
  { name: "Getting Started", pages: ["installation"] },
  {
    name: "Self-hosting",
    pages: ["self-hosting", "systemd-service", "cloudflare-tunnels"],
  },
  {
    name: "Integrations",
    pages: ["google", "notion", "oura", "toggl", "zotero"],
  },
].map((section) => {
  return {
    name: section.name,
    pages: section.pages.map((slug) => {
      const post = allPosts.find((post) => post.fileName === slug);
      if (!post) {
        throw new Error(`Missing post: ${slug}`);
      }
      const page = { ...post, section: section.name };
      allPages.push(page);
      return page;
    }),
  };
});

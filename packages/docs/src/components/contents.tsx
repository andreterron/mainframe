// import { format, parseISO } from "date-fns";
import Link from "next/link";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { allPages } from "./posts";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { mdxComponents } from "./mdx";
import { allPosts } from "contentlayer/generated";

export function PostContents({ slug }: { slug: string }) {
  const postIndex = allPages.findIndex(
    (post) => post._raw.flattenedPath === slug,
  );
  const post =
    postIndex !== -1
      ? allPages[postIndex]!
      : allPosts.find((post) => post._raw.flattenedPath === slug);
  if (!post) throw new Error(`Post not found for slug: ${slug}`);
  const previousPost = postIndex > 0 ? allPages[postIndex - 1] : undefined;
  const nextPost =
    postIndex !== -1 && postIndex < allPages.length - 1
      ? allPages[postIndex + 1]
      : undefined;

  const MDXContent = useMDXComponent(post.body.code);

  return (
    <article className="px-8 py-8 w-full max-w-3xl">
      <div className="mb-8">
        {/* <time
          dateTime={post.date}
          className="mb-1 text-xs text-muted-foreground"
        >
          {format(parseISO(post.date), "LLLL d, yyyy")}
        </time> */}
        {post.section && (
          <div className="mb-1 text-xs text-primary uppercase font-bold">
            {post.section}
          </div>
        )}
        <div className="mb-3">
          <h1 className="text-3xl font-bold mb-0">{post.title}</h1>
          {post.description ? (
            <p className="py-0 my-0">{post.description}</p>
          ) : null}
        </div>
      </div>
      <div className="[&>*]:mb-3 [&>*:last-child]:mb-0 prose dark:prose-invert mb-6 max-w-none">
        <MDXContent components={mdxComponents} />
      </div>
      {(previousPost || nextPost) && (
        <div className="prose dark:prose-invert max-w-none">
          <hr className="mb-8 mt-12" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {previousPost && (
              <Button
                variant="outline"
                className="sm:col-start-1 sm:w-fit justify-start"
                asChild
              >
                <Link href={previousPost.url}>
                  <ChevronLeft className="size-4 mr-2" />
                  {previousPost.title}
                </Link>
              </Button>
            )}
            {nextPost && (
              <Button
                variant="outline"
                className="sm:col-start-2 sm:w-fit sm:ml-auto justify-end"
                asChild
              >
                <Link href={nextPost.url}>
                  {nextPost.title}
                  <ChevronRight className="size-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

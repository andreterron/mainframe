import { allPosts } from "contentlayer/generated";
import { PostContents } from "../../components/contents";

export const generateStaticParams = async () =>
  allPosts.map((post) => ({
    slug: post._raw.flattenedPath.split("/"),
    fileName: post.fileName,
  }));

export const generateMetadata = ({
  params,
}: {
  params: { slug: string[] };
}) => {
  const post = allPosts.find(
    (post) => post._raw.flattenedPath === params.slug.join("/"),
  );
  if (!post) throw new Error(`Post not found for slug: ${params.slug}`);
  return { title: `${post.title} - Mainframe Docs` };
};

const PostLayout = ({ params }: { params: { slug: string[] } }) => {
  return <PostContents slug={params.slug.join("/")} />;
};

export default PostLayout;

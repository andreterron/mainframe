import { allPosts } from "contentlayer/generated";
import { PostContents } from "../../../components/contents";

export const generateStaticParams = async () =>
  allPosts.map((post) => ({ slug: post.fileName }));

export const generateMetadata = ({ params }: { params: { slug: string } }) => {
  const post = allPosts.find((post) => post.fileName === params.slug);
  if (!post) throw new Error(`Post not found for slug: ${params.slug}`);
  return { title: `${post.title} - Mainframe` };
};

const PostLayout = ({ params }: { params: { slug: string } }) => {
  return <PostContents slug={params.slug} />;
};

export default PostLayout;

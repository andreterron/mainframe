import { defineDocumentType, makeSource } from "contentlayer2/source-files";

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    description: { type: "string", required: false },
    date: { type: "date", required: false },
    path: { type: "string", required: false },
  },
  computedFields: {
    fileName: {
      type: "string",
      resolve: (post) => post._raw.sourceFileName.replace(/\.mdx$/, ""),
    },
    url: {
      type: "string",
      resolve: (post) => {
        console.log(post._raw);
        return (
          post.path ||
          `/posts/${post._raw.sourceFileName.replace(/\.mdx$/, "")}`
        );
      },
    },
  },
}));

export default makeSource({ contentDirPath: "posts", documentTypes: [Post] });

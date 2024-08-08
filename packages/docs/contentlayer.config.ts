import { defineDocumentType, makeSource } from "contentlayer2/source-files";

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `**/*.{md,mdx}`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    description: { type: "string", required: false },
    date: { type: "date", required: false },
    path: { type: "string", required: false },
    basepath: { type: "string", required: false },
  },
  computedFields: {
    fileName: {
      type: "string",
      resolve: (post) => post._raw.sourceFileName.replace(/\.mdx?$/, ""),
    },
    url: {
      type: "string",
      resolve: (post) => post.path || `/${post._raw.flattenedPath}`,
    },
  },
}));

export default makeSource({ contentDirPath: "posts", documentTypes: [Post] });

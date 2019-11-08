import { DirectoryItem } from "../types";

export const route = "fetchDirectory.dappmanager.dnp.dappnode.eth";

// No request arguments
export type RequestData = {};

export type ReturnData = DirectoryItem[];

export const returnDataSchema = {
  type: "array",
  title: "directory",
  items: {
    type: "object",
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      avatar: { type: "string" },
      isInstalled: { type: "boolean" },
      isUpdated: { type: "boolean" },
      whitelisted: { type: "boolean" },
      isFeatured: { type: "boolean" },
      featuredStyle: { type: "object" },
      categories: { type: "array", items: { type: "string" } }
    },
    required: [
      "name",
      "description",
      "avatar",
      "isInstalled",
      "isUpdated",
      "whitelisted",
      "isFeatured",
      "categories"
    ]
  }
};

// Samples for testing

export const returnDataSample: ReturnData = [
  {
    name: "name",
    description: "desc",
    avatar: "http://",
    isInstalled: true,
    isUpdated: false,
    whitelisted: true,
    isFeatured: true,
    featuredStyle: {
      featuredBackground: "#fff",
      featuredColor: "#fff",
      featuredAvatarFilter: "invert(1)"
    },
    categories: ["Developer Tools"]
  }
];

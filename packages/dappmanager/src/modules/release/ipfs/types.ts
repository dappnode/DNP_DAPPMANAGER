export type Format = "JSON" | "YAML" | "TEXT";

export interface FileConfig {
  regex: RegExp;
  format: Format;
  maxSize: number;
  required: boolean;
  multiple: boolean;
}

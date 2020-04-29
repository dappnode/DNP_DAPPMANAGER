import fs from "fs";
import path from "path";
import * as TJS from "typescript-json-schema";

const baseDir = "src/common/schemas";

const typesToSchema = [
  "RoutesArguments",
  "RoutesReturn",
  "SubscriptionsArguments"
];

const getPath = (typeName: string): string =>
  path.join(baseDir, `${typeName}.schema.json`);
fs.mkdirSync(baseDir, { recursive: true });

// Pre-generate files so compilation doesn't fail
for (const typeName of typesToSchema) {
  fs.writeFileSync(getPath(typeName), "");
}

// Compile types to schemas
const program = TJS.programFromConfig("tsconfig.json");
for (const typeName of typesToSchema) {
  console.log(`Generating .schema.json of ${typeName}`);
  const schema = TJS.generateSchema(program, typeName, {
    required: true
  });
  if (!schema) throw Error(`Error generating ${typeName} schema`);

  // Sanitize schema
  delete schema.required;
  // Remove empty arrays of items from argument schemas
  for (const route in schema.properties) {
    const prop = schema.properties[route] as any;
    if (prop.type === "array" && prop.items.length === 0)
      delete schema.properties[route];
  }

  fs.writeFileSync(getPath(typeName), JSON.stringify(schema, null, 2));
}

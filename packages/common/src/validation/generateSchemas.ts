import fs from "fs";
import path from "path";
import TJS from "typescript-json-schema";
const tsConfigPath = process.argv[2]; // tsconfig.json
const baseDir = process.argv[3]; // "src/common/schemas";

if (!tsConfigPath || !baseDir)
  throw Error("Requires 2 positional arguments: <tsConfigPath> <baseDir>");

const typesToSchema = [
  "RoutesArguments",
  "RoutesReturn",
  "SubscriptionsArguments",
];

const getTsPath = (typeName: string) => {
  const firstLetter = typeName[0].toLowerCase();
  const rest = typeName.slice(1);
  return path.join(baseDir, `${firstLetter}${rest}.schema.ts`);
};

const getJsonPath = (typeName: string) =>
  path.join(baseDir, `${typeName}.schema.json`);
fs.mkdirSync(baseDir, { recursive: true });

// Pre-generate files so compilation doesn't fail
for (const typeName of typesToSchema) {
  fs.writeFileSync(getJsonPath(typeName), "{}");
}

// Compile types to schemas
const program = TJS.programFromConfig(tsConfigPath);
for (const typeName of typesToSchema) {
  /* eslint-disable-next-line no-console */
  console.log(`Generating .schema.json of ${typeName}`);
  const schema = TJS.generateSchema(program, typeName, {
    required: true,
  });
  if (!schema) throw Error(`Error generating ${typeName} schema`);

  // Sanitize schema
  delete schema.required;
  // Remove empty arrays of items from argument schemas
  for (const route in schema.properties) {
    const prop = schema.properties[route];
    if (typeof prop !== "boolean" && prop.type === "array" && !prop.items)
      delete schema.properties[route];
  }

  fs.writeFileSync(getJsonPath(typeName), JSON.stringify(schema, null, 2));
  fs.writeFileSync(
    getTsPath(typeName),
    `export default ${JSON.stringify(schema)};`
  );
}

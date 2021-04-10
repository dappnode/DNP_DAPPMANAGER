// If the keyword value is an object, then for the data array to be valid
// each item of the array should be valid according to the schema in this value.
// In this case the additionalItems keyword is ignored.
export const checkPortsResponseSchema = {
  type: "object",
  maxProperties: 2,
  additionalProperties: false,
  properties: {
    tcpPorts: {
      uniqueItems: true,
      type: "array",
      items: {
        type: "object",
        maxProperties: 3,
        minProperties: 2,
        additionalProperties: false,
        required: ["port", "status"],
        properties: {
          port: {
            type: "integer",
            minimum: 0,
            maximum: 65535
          },
          status: {
            type: "string",
            pattern: "^(open|closed|error|unknown)$"
          },
          message: {
            type: "string"
          }
        }
      }
    },
    udpPorts: {
      uniqueItems: true,
      type: "array",
      items: {
        type: "object",
        maxProperties: 3,
        minProperties: 2,
        additionalProperties: false,
        required: ["port", "status"],
        properties: {
          port: {
            type: "integer",
            minimum: 0,
            maximum: 65535
          },
          status: {
            type: "string",
            pattern: "^(open|closed|error|unknown)$"
          },
          message: {
            type: "string"
          }
        }
      }
    }
  }
};

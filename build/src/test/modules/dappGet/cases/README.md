# dappGet full test cases

This folder contains scripts that export a JSON object that defined a test case. All objects are imported in [`index.js`](./index.js) are exported as an array. This array is imported in [`../integration.test.js`](../integration.test.js) and all test cases are run secuentially.

The case object definition must contain:

- **name**: Case definition, will show up in the mocha test title
- **req**: The request to be resolved
- **expectedState**: The expected outcome of the resolver
- **dnps**: All the info about dependencies, versions, and which DNP is installed at which version.

Optional parameteres

- **expectedAggregate**: The expected outcome of the aggregator.

// rewiremock.es6.js
import rewiremock, { addPlugin, plugins } from "rewiremock";
/// settings
rewiremock.overrideEntryPoint(module); // this is important
addPlugin(plugins.alwaysMatchOrigin);
export { rewiremock };

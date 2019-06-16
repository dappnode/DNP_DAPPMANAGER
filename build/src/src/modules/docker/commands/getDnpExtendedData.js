const getDnpsExtendedData = require("./getDnpsExtendedData");
const { stringIncludes } = require("utils/strings");

async function getDnpExtendedData(idOrName) {
  const dnps = await getDnpsExtendedData();
  return dnps.find(
    ({ id, name }) =>
      stringIncludes(id, idOrName) || stringIncludes(name, idOrName)
  );
}

module.exports = getDnpExtendedData;

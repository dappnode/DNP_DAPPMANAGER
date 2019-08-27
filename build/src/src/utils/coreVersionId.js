/**
 * Compute version id:
 * admin@0.2.4,vpn@0.2.2,core@0.2.6
 * - Sort alphabetically to ensure the version ID is deterministic
 *
 * @param {object[]} coreDnps
 * @return {string} versionId = "admin@0.2.4,vpn@0.2.2,core@0.2.6"
 */
function getCoreVersionId(coreDnps) {
  return coreDnps
    .filter(({ name, version }) => name && version)
    .map(({ name, version }) => [name.split(".")[0], version].join("@"))
    .sort()
    .join(",");
}

function parseCoreVersionId(versionId) {
  return versionId
    .split(",")
    .filter(nameAtVersion => nameAtVersion)
    .map(nameAtVersion => {
      const [shortName, version] = nameAtVersion.split("@");
      return { name: `${shortName}.dnp.dappnode.eth`, version };
    });
}

function parseCoreVersionIdToStrings(versionId = "") {
  return versionId.split(",");
}

module.exports = {
  getCoreVersionId,
  parseCoreVersionId,
  parseCoreVersionIdToStrings
};

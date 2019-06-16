const dnpBlacklist = {
  stop: ["dappmanager.dnp.dappnode.eth"],
  down: ["dappmanager.dnp.dappnode.eth"]
};

function checkDnpBlacklist(action, id) {
  if (!dnpBlacklist[action]) throw Error(`Unkown action: ${action}`);
  if (dnpBlacklist[action].includes(id)) throw Error(`Cannot ${action} ${id}`);
}

module.exports = checkDnpBlacklist;

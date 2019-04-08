const supportedDomains = ["eth"];

function isEnsDomain(ensDomain) {
  if (!ensDomain) return false;
  if (ensDomain.includes("/")) return false;
  if (!ensDomain.includes(".")) return false;
  // "kovan.dnp.dappnode.eth" => "eth"
  const domain = ensDomain.split(".").slice(-1)[0];
  if (!supportedDomains.includes(domain)) return false;
  // If any negative condition was matched:
  return true;
}

module.exports = isEnsDomain;

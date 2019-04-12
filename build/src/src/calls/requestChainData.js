const params = require("../params");
const { eventBus, eventBusTag } = require("eventBus");

/**
 * Requests chain data. Also instructs the DAPPMANAGER
 * to keep sending data for a period of time (5 minutes)
 */
const requestChainData = async () => {
  params.CHAIN_DATA_UNTIL = Date.now() + 5 * 60 * 1000;

  // Trigger a chainData fetch immediately so
  // it is shown as quick as possible in the front-end
  eventBus.emit(eventBusTag.requestedChainData);

  // Do NOT log a message or a user action as this method is call too often
  return {
    message: `Requested chain data until ${params.CHAIN_DATA_UNTIL}`
  };
};

module.exports = requestChainData;

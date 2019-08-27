const async = require("async");

function runOnlyOneSequentially(fn) {
  // create a cargo object with an infinite payload
  var cargo = async.cargo(function(tasks, callback) {
    fn(...tasks[0].args).then(() => {
      callback();
    });
  }, 1e9);

  return function(...args) {
    cargo.push({ args });
  };
}

function pause(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  runOnlyOneSequentially,
  pause
};

function validateKwargs(kwargs) {
  for (const key of Object.keys(kwargs)) {
    if (!kwargs[key]) throw Error(`${key} must be defined`);
  }
}

module.exports = validateKwargs;

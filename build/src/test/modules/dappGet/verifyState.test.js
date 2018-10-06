const assert = require('assert');
const verifyState = require('../../../src/modules/dappGet/resolver/verifyState');
const repo = getRepo();

describe('verifyState', () => {
  it('should return true for a valid state', () => {
    const state = {
      A: '1.0.0',
      B: '1.0.0',
      C: '1.0.0',
    };
    const res = verifyState(state, repo);
    assert.equal(res.valid, true);
  });

  it('should return false, dependency no installed', () => {
    const state = {
      A: '1.0.0',
    };
    // { req: 'A@1.0.0', dep: 'C', depVer: undefined, reqRange: '^1.0.0' }
    const res = verifyState(state, repo);
    assert.equal(res.valid, false);
    assert.deepStrictEqual(res.reason, {
      req: 'A@1.0.0',
      dep: 'C@undefined',
      range: '^1.0.0',
    });
  });

  it('should return false, invalid dependency', () => {
    const state = {
      A: '1.0.0',
      C: '2.0.0',
    };
    // { req: 'A@1.0.0', dep: 'C', depVer: '2.0.0', reqRange: '^1.0.0' }
    const res = verifyState(state, repo);
    assert.equal(res.valid, false);
    assert.deepStrictEqual(res.reason, {
      req: 'A@1.0.0',
      dep: 'C@2.0.0',
      range: '^1.0.0',
    });
  });
});

function getRepo() {
  return {
    'A': {
      '1.0.0': {dependencies: {'C': '^1.0.0'}},
    },
    'B': {
      '1.0.0': {dependencies: {'C': '^1.0.0'}},
    },
    'C': {
      '1.0.0': {dependencies: {}},
      '2.0.0': {dependencies: {}},
    },
  };
}

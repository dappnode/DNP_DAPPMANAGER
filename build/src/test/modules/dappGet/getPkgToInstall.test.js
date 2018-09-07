const assert = require('assert');
const getPkgsToInstall = require('modules/dappGet/getPkgsToInstall');
const repo = getRepo();

describe('pkgToInstallState', () => {
    it('should not crash against circular dependencies D1 -> D1', () => {
        const res = getPkgsToInstall('CircularUni1', '1.0.0', repo);
        assert.deepStrictEqual(Object.keys(res), [
            'CircularUni1',
        ]);
    });

    it('should not crash against circular dependencies D1 -> D2 -> D1', () => {
        const res = getPkgsToInstall('CircularDouble1', '1.0.0', repo);
        assert.deepStrictEqual(Object.keys(res), [
            'CircularDouble1',
            'CircularDouble2',
        ]);
    });

    it('should not crash against circular dependencies D1 -> D2 -> D3 -> D1', () => {
        const res = getPkgsToInstall('CircularTriple1', '1.0.0', repo);
        assert.deepStrictEqual(Object.keys(res), [
            'CircularTriple1',
            'CircularTriple2',
            'CircularTriple3',
        ]);
    });
});

function getRepo() {
    return {
      'A': {
        '1.0.0': {'C': '1.0.0'},
        '2.0.0': {'C': '1.0.0'},
        '2.0.1': {'C': '2.0.0'},
      },
      'B': {
        '1.0.0': {'C': '1.0.0'},
        '2.0.0': {'C': '2.0.0'},
      },
      'C': {
        '1.0.0': {},
        '2.0.0': {},
      },
      'CircularUni1': {
        '1.0.0': {'CircularUni1': '1.0.0'},
      },
      'CircularDouble1': {
        '1.0.0': {'CircularDouble2': '1.0.0'},
      },
      'CircularDouble2': {
        '1.0.0': {'CircularDouble1': '1.0.0'},
      },
      'CircularTriple1': {
        '1.0.0': {'CircularTriple2': '1.0.0'},
      },
      'CircularTriple2': {
        '1.0.0': {'CircularTriple3': '1.0.0'},
      },
      'CircularTriple3': {
        '1.0.0': {'CircularTriple1': '1.0.0'},
      },
    };
  }

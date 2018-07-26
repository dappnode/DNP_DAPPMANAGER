const expect = require('chai').expect;
const utils = require('./orderDependencies');


describe('Util: install', function() {
  describe('.mulBool: multiply an array of booleans', function() {
    it('should return true with [1,1,1]', () => {
      expect( utils.mulBool([true, true, true]) )
        .to.be.true;
    });

    it('should return false with [1,1,0]', () => {
      expect( utils.mulBool([true, true, false]) )
        .to.be.false;
    });
  });

  describe('.check: check if a list of dependencies has been installed already', function() {
    let registry = {
      a: false,
      b: true,
      c: true,
    };
    it('should return true with an empty array of dependencies', () => {
      expect( utils.check({}, registry) )
        .to.be.true;
    });

    it('should return false with one unfullfilled dependecy', () => {
      expect( utils.check({
        a: 'latest',
      }, registry) )
        .to.be.false;
    });

    it('should return true with fullfilled dependencies', () => {
      expect( utils.check({
        b: 'latest',
        c: 'latest',
      }, registry) )
        .to.be.true;
    });

    it('should return false with unfullfilled dependencies', () => {
      expect( utils.check({
        a: 'latest',
        b: 'latest',
        c: 'latest',
      }, registry) )
        .to.be.false;
    });
  });

  describe('.createRegistry', function() {
    it('should create a registry', () => {
      const packageList = [{
        name: 'packageA',
      },
      {
        name: 'packageB',
      }];
      const expectedResult = {
        'packageA': false,
        'packageB': false,
      };

      expect( utils.createRegistry(packageList) )
        .to.be.deep.equal(expectedResult);
    });
  });

  describe('.resolve: updates the registry and pushes deps into an array', function() {
    const A = {
      name: 'a',
      dep: {b: 'latest'},
    }; const B = {
      name: 'b',
      dep: {},
    };
    const packageList = [A, B];
    const expectedResult = [B];

    let order = [];

    let registry = utils.createRegistry(packageList);

    utils.resolve(packageList, registry, order);

    it('should update registry for fullfilled dep', () => {
      expect( registry.b )
        .to.be.true;
    });

    it('should push first dependecy to the order array', () => {
      expect( order )
        .to.be.deep.equal(expectedResult);
    });
  });

  describe('.orderDependencies: should return and array with ordered dep names', function() {
    const A = {
      name: 'a',
      dep: {b: 'latest', c: 'latest'},
    };
    const B = {
      name: 'b',
      dep: {},
    };
    const C = {
      name: 'c',
      dep: {b: 'latest'},
    };

    const input = [A, B, C];
    const expectedResult = [B, C, A];

    it('should return the expectedResult', () => {
      expect( utils.orderDependencies(input) )
        .to.deep.equal(expectedResult);
    });

    it('should throw passing an invalid input', () => {
      // `` expect(parent.method.bind(parent, arg)).to.throw() ``
      // to test whether something is thrown, you have to pass a function to expect,
      // which expect will call itself. The bind method used above creates
      // a new function which when called will call ``parent.method`` with this
      // set to the value of ``parent`` and the first argument set to ``arg``.
      expect( utils.orderDependencies.bind(utils, 'invalid input') )
        .to.throw();
    });

    it('should throw passing an invalid input', () => {
      C.dep = 'invalid dep value';
      expect( utils.orderDependencies.bind(utils, ['invalid input']) )
        .to.throw();
    });

    it('should throw passing an invalid input', () => {
      C.dep = 'invalid dep value';
      expect( utils.orderDependencies.bind(utils, [{name: 'a'}]) )
        .to.throw();
    });

    it('should throw passing an invalid input', () => {
      C.dep = 'invalid dep value';
      expect( utils.orderDependencies.bind(utils, [{name: 'a', dep: ['b']}]) )
        .to.throw();
    });
  });
});

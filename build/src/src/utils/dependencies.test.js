const expect = require('chai').expect;
const dependencies = require('./dependencies');
const semver = require('semver');


describe('Util: get dependencies', () => {
  let dependencyObjectMock = {
    'packageA': {
      packageB: '0.0.1',
      packageC: 'latest',
      packageD: 'latest',
    },
    'packageB': {
      packageC: 'latest',
    },
    'packageB@0.0.1': {
      packageC: 'latest',
    },
    'packageB@0.0.2': {
      packageC: 'latest',
    },
    'packageC': {},
    'packageD': {
      packageB: '0.0.2',
      packageC: 'latest',
    },
    'packageE': {
      packageE: 'latest',
    },
    'dappmanager': {
      admin: 'latest',
    },
    'vpn': {
      admin: 'latest',
    },
    'admin': {
      vpn: 'latest',
      dappmanager: 'latest',
    },
    'dappmanager@0.1.10': {
      admin: '0.1.10',
      vpn: '0.1.10',
    },
    'admin@0.1.10': {
      dappmanager: '0.1.10',
      vpn: '0.1.10',
    },
    'vpn@0.1.10': {
      admin: '0.1.10',
      dappmanager: '0.1.10',
    },
  };

  async function getManifestMock(packageReq) {
    let packageReqSemver = semver.valid(packageReq.ver);
    let id = packageReqSemver ? packageReq.name + '@' + packageReqSemver : packageReq.name;

    return {
      dependencies: dependencyObjectMock[id],
    };
  }


  describe('.sortByNameKey', () => {
    it('should sort', () => {
      const input = [{name: 'B'}, {name: 'A'}];
      const expectedResult = [{name: 'A'}, {name: 'B'}];

      expect( input.sort(dependencies.sortByNameKey) )
        .to.deep.equal( expectedResult );
    });
  });


  describe('.byUniqueObjects', () => {
    it('should filter duplicated objects', () => {
      const input = [{name: 'A', ver: '1'}, {name: 'A', ver: '2'}, {name: 'A', ver: '1'}];
      const expectedResult = [{name: 'A', ver: '1'}, {name: 'A', ver: '2'}];

      expect( input.filter(dependencies.byUniqueObjects) )
        .to.deep.equal( expectedResult );
    });
  });


  describe('.getAll: should fetch deps', () => {
    it('should fetch deps', async () => {
      const packageReq = {
        name: 'packageB',
        ver: 'latest',
      };
      // B should appear 1 time, C 1 time
      const expectedResult = {
        packageB: {
          name: 'packageB', ver: 'latest',
          dep: dependencyObjectMock.packageB,
          manifest: await getManifestMock({name: 'packageB'}),
        },
        packageC: {
          name: 'packageC', ver: 'latest',
          dep: dependencyObjectMock.packageC,
          manifest: await getManifestMock({name: 'packageC'}),
        },
      };
      let res = await dependencies.getAll(packageReq, getManifestMock);

      // sorting object because deep equal and include is buggy sometimes
      // res = res.sort(dependencies.sortByNameKey);

      expect( res )
        .to.deep.equal( expectedResult );
    });

    it('should fetch very complex deps', async () => {
      const packageReq = {
        name: 'packageA',
        ver: 'latest',
      };
      // A should appear 1 time, B 2 times, C 4 times, D 1 time
      const expectedResult = {
        packageA: {
          name: 'packageA', ver: 'latest',
          dep: dependencyObjectMock.packageA,
          manifest: await getManifestMock({name: 'packageA'}),
        },
        packageB: {
          name: 'packageB', ver: '0.0.2',
          dep: dependencyObjectMock.packageB,
          manifest: await getManifestMock({name: 'packageB'}),
        },
        packageC: {
          name: 'packageC', ver: 'latest',
          dep: dependencyObjectMock.packageC,
          manifest: await getManifestMock({name: 'packageC'}),
        },
        packageD: {
          name: 'packageD', ver: 'latest',
          dep: dependencyObjectMock.packageD,
          manifest: await getManifestMock({name: 'packageD'}),
        },
      };

      let res = await dependencies.getAll(packageReq, getManifestMock);

      // sorting object because deep equal and include is buggy sometimes

      expect( res )
        .to.deep.equal( expectedResult );
    });

    it('should catch infinite dependecy loops', async () => {
      const packageReq = {
        name: 'packageE',
        ver: 'latest',
      };

      const expectedResult = [
        {
          name: 'packageE', ver: 'latest',
          dep: dependencyObjectMock.packageE,
          manifest: await getManifestMock({name: 'packageE'}),
        },
      ];

      let res = await dependencies.getAllResolved(packageReq, getManifestMock);
      expect( res )
        .to.deep.equal( expectedResult );
    });

    it('should resolve circular dependencies requesting dappmanager', async () => {
      const packageReq = {
        name: 'dappmanager',
        ver: 'latest',
      };
      const expectedResult = {
        dappmanager: {
          name: 'dappmanager', ver: 'latest',
          dep: dependencyObjectMock.dappmanager,
          manifest: await getManifestMock({name: 'dappmanager'}),
        },
        vpn: {
          name: 'vpn', ver: 'latest',
          dep: dependencyObjectMock.vpn,
          manifest: await getManifestMock({name: 'vpn'}),
        },
        admin: {
          name: 'admin', ver: 'latest',
          dep: dependencyObjectMock.admin,
          manifest: await getManifestMock({name: 'admin'}),
        },
      };

      let res = await dependencies.getAll(packageReq, getManifestMock);

      expect( res )
        .to.deep.equal( expectedResult );
    });

    it('should resolve circular dependencies requesting vpn', async () => {
      const packageReq = {
        name: 'vpn',
        ver: 'latest',
      };
      const expectedResult = {
        dappmanager: {
          name: 'dappmanager', ver: 'latest',
          dep: dependencyObjectMock.dappmanager,
          manifest: await getManifestMock({name: 'dappmanager'}),
        },
        vpn: {
          name: 'vpn', ver: 'latest',
          dep: dependencyObjectMock.vpn,
          manifest: await getManifestMock({name: 'vpn'}),
        },
        admin: {
          name: 'admin', ver: 'latest',
          dep: dependencyObjectMock.admin,
          manifest: await getManifestMock({name: 'admin'}),
        },
      };

      let res = await dependencies.getAll(packageReq, getManifestMock);

      expect( res )
        .to.deep.equal( expectedResult );
    });

    it('should resolve circular dependencies requesting admin', async () => {
      const packageReq = {
        name: 'admin',
        ver: 'latest',
      };
      const expectedResult = {
        dappmanager: {
          name: 'dappmanager', ver: 'latest',
          dep: dependencyObjectMock.dappmanager,
          manifest: await getManifestMock({name: 'dappmanager'}),
        },
        vpn: {
          name: 'vpn', ver: 'latest',
          dep: dependencyObjectMock.vpn,
          manifest: await getManifestMock({name: 'vpn'}),
        },
        admin: {
          name: 'admin', ver: 'latest',
          dep: dependencyObjectMock.admin,
          manifest: await getManifestMock({name: 'admin'}),
        },
      };

      let res = await dependencies.getAll(packageReq, getManifestMock);

      expect( res )
        .to.deep.equal( expectedResult );
    });
  });

  describe('.getAllResolved final complete test', () => {
    it('should return the package req (which has no dependencies)', async () => {
      const packageReq = {
        name: 'packageC',
        ver: 'latest',
      };

      const expectedResult = [
        {
          name: 'packageC', ver: 'latest',
          dep: dependencyObjectMock.packageC,
          manifest: await getManifestMock({name: 'packageC'}),
        },
      ];

      let res = await dependencies.getAllResolved(packageReq, getManifestMock);

      expect( res )
        .to.deep.equal( expectedResult );
    });

    it('should return a correct resolved package list', async () => {
      const packageReq = {
        name: 'packageA',
        ver: 'latest',
      };

      const expectedResult = [
        {
          name: 'packageA', ver: 'latest',
          dep: dependencyObjectMock.packageA,
          manifest: await getManifestMock({name: 'packageA'}),
        },
        {
          name: 'packageB', ver: '0.0.2',
          dep: dependencyObjectMock.packageB,
          manifest: await getManifestMock({name: 'packageB'}),
        },
        {
          name: 'packageC', ver: 'latest',
          dep: dependencyObjectMock.packageC,
          manifest: await getManifestMock({name: 'packageC'}),
        },
        {
          name: 'packageD', ver: 'latest',
          dep: dependencyObjectMock.packageD,
          manifest: await getManifestMock({name: 'packageD'}),
        },
      ];

      let res = await dependencies.getAllResolved(packageReq, getManifestMock);

      expect( res )
        .to.deep.equal( expectedResult );
    });

    it('should resolve circular dependencies requesting admin', async () => {
      const packageReq = {
        name: 'admin',
        ver: '0.1.10',
      };
      const expectedResult = [
        {
          name: 'admin', ver: '0.1.10',
          dep: dependencyObjectMock['admin@0.1.10'],
          manifest: await getManifestMock({name: 'admin', ver: '0.1.10'}),
        },
        {
          name: 'dappmanager', ver: '0.1.10',
          dep: dependencyObjectMock['dappmanager@0.1.10'],
          manifest: await getManifestMock({name: 'dappmanager', ver: '0.1.10'}),
        },
        {
          name: 'vpn', ver: '0.1.10',
          dep: dependencyObjectMock['vpn@0.1.10'],
          manifest: await getManifestMock({name: 'vpn', ver: '0.1.10'}),
        },
      ];

      let res = await dependencies.getAllResolved(packageReq, getManifestMock);
      expect( res )
        .to.deep.equal( expectedResult );
    });
  });
});

const chai = require('chai')
const expect = require('chai').expect
const dependencies = require('./dependencies')


describe('Util: get dependencies', () => {

  let dependencyObjectMock = {
    packageA: {
      packageB: 'latest',
      packageC: 'latest',
      packageD: 'latest'
    },
    packageB: {
      packageC: 'latest'
    },
    packageC: {},
    packageD: {
      packageB: 'latest',
      packageC: 'latest'
    },
    packageE: {
      packageE: 'latest'
    }
  }

  async function getManifestMock (packageReq) {
    return {
      dependencies: dependencyObjectMock[packageReq.name]
    }
  }


  describe('.sortByNameKey', () => {

    it('should sort', () => {

      const input           = [{name: 'B'}, {name: 'A'}]
      const expected_result = [{name: 'A'}, {name: 'B'}]

      expect( input.sort(dependencies.sortByNameKey) )
        .to.deep.equal( expected_result )
    })
  })


  describe('.byUniqueObjects', () => {

    it('should filter duplicated objects', () => {

      const input           = [{name: 'A', ver: '1'}, {name: 'A', ver: '2'}, {name: 'A', ver: '1'}]
      const expected_result = [{name: 'A', ver: '1'}, {name: 'A', ver: '2'}]

      expect( input.filter(dependencies.byUniqueObjects) )
        .to.deep.equal( expected_result )
    })
  })


  describe('.getAll: should fetch deps', () => {

    it('should fetch deps', async () => {

      const packageReq = {
        name: 'packageB',
        ver: 'latest'
      }
      // B should appear 1 time, C 1 time
      const expected_result = [].concat(
        Array(1).fill({
          name: 'packageB', ver: 'latest',
          dep: dependencyObjectMock.packageB,
          manifest: await getManifestMock({name: 'packageB'})
        }),
        Array(1).fill({
          name: 'packageC', ver: 'latest',
          dep: dependencyObjectMock.packageC,
          manifest: await getManifestMock({name: 'packageC'})
        })
      )
      let res = await dependencies.getAll(packageReq, getManifestMock)

      // sorting object because deep equal and include is buggy sometimes
      res = res.sort(dependencies.sortByNameKey)

      expect( res )
        .to.deep.equal( expected_result )
    })

    it('should fetch very complex deps', async () => {

      const packageReq = {
        name: 'packageA',
        ver: 'latest'
      }
      // A should appear 1 time, B 2 times, C 4 times, D 1 time
      const expected_result = [].concat(
        Array(1).fill({
          name: 'packageA', ver: 'latest',
          dep: dependencyObjectMock.packageA,
          manifest: await getManifestMock({name: 'packageA'})
        }),
        Array(2).fill({
          name: 'packageB', ver: 'latest',
          dep: dependencyObjectMock.packageB,
          manifest: await getManifestMock({name: 'packageB'})
        }),
        Array(4).fill({
          name: 'packageC', ver: 'latest',
          dep: dependencyObjectMock.packageC,
          manifest: await getManifestMock({name: 'packageC'})
        }),
        Array(1).fill({
          name: 'packageD', ver: 'latest',
          dep: dependencyObjectMock.packageD,
          manifest: await getManifestMock({name: 'packageD'})
        })
      )

      let res = await dependencies.getAll(packageReq, getManifestMock)

      // sorting object because deep equal and include is buggy sometimes
      res = res.sort(dependencies.sortByNameKey)

      expect( res )
        .to.deep.equal( expected_result )
    })

    it('should catch infinite dependecy loops', async () => {

      const packageReq = {
        name: 'packageE',
        ver: 'latest'
      }

      let error = '--- getAll did not throw ---'
      try {
        await dependencies.getAll(packageReq, getManifestMock)
      } catch(e) {
        error = e.message
      }
      expect(error).to.include('DEPENDENCY LOOP FOUND')
    })


  })

  describe('.resolveConflictingVersions', () => {

    it('should clean up repeated versions', async () => {

      const dependecyList = [].concat(
        Array(3).fill({
          name: 'packageA', ver: 'latest',
          dep: dependencyObjectMock.packageA,
          manifest: await getManifestMock({name: 'packageA'})
        })
      )

      const expected_result = [].concat(
        Array(1).fill({
          name: 'packageA', ver: 'latest',
          dep: dependencyObjectMock.packageA,
          manifest: await getManifestMock({name: 'packageA'})
        })
      )

      let res = dependencies.resolveConflictingVersions(dependecyList)
      expect( res )
        .to.deep.equal( expected_result )

    })

    it('should return only the highest version', () => {

      const dependecyList = [
        {
          name: 'packageA', ver: '1.2.3',
          dep: dependencyObjectMock.packageA
        },
        {
          name: 'packageA', ver: '1.4.2',
          dep: dependencyObjectMock.packageA
        },
        {
          name: 'packageB', ver: 'latest',
          dep: dependencyObjectMock.packageB
        },
        {
          name: 'packageB', ver: '0.0.1',
          dep: dependencyObjectMock.packageB
        }
      ]

      const expected_result = [
        {
          name: 'packageA', ver: '1.4.2',
          dep: dependencyObjectMock.packageA
        },
        {
          name: 'packageB', ver: 'latest',
          dep: dependencyObjectMock.packageB
        }
      ]

      let res = dependencies.resolveConflictingVersions(dependecyList)
      expect( res )
        .to.deep.equal( expected_result )

    })
  })

  describe('.resolveConflictingVersions', () => {

    it('should clean up repeated versions', () => {

      const dependecyList = [].concat(
        Array(3).fill({
          name: 'packageA', ver: 'latest',
          dep: dependencyObjectMock.packageA
        })
      )

      const expected_result = [].concat(
        Array(1).fill({
          name: 'packageA', ver: 'latest',
          dep: dependencyObjectMock.packageA
        })
      )

      let res = dependencies.resolveConflictingVersions(dependecyList)
      expect( res )
        .to.deep.equal( expected_result )

    })

    it('should return only the highest version', () => {

      const dependecyList = [
        {
          name: 'packageA', ver: '1.2.3',
          dep: dependencyObjectMock.packageA
        },
        {
          name: 'packageA', ver: '1.4.2',
          dep: dependencyObjectMock.packageA
        },
        {
          name: 'packageB', ver: 'latest',
          dep: dependencyObjectMock.packageB
        },
        {
          name: 'packageB', ver: '0.0.1',
          dep: dependencyObjectMock.packageB
        }
      ]

      const expected_result = [
        {
          name: 'packageA', ver: '1.4.2',
          dep: dependencyObjectMock.packageA
        },
        {
          name: 'packageB', ver: 'latest',
          dep: dependencyObjectMock.packageB
        }
      ]

      let res = dependencies.resolveConflictingVersions(dependecyList)
      expect( res )
        .to.deep.equal( expected_result )

    })
  })

  describe('.resolveConflictingVersions', () => {

    it('should clean up repeated versions', () => {

      const dependecyList = [].concat(
        Array(3).fill({
          name: 'packageA', ver: 'latest',
          dep: dependencyObjectMock.packageA
        })
      )

      const expected_result = [].concat(
        Array(1).fill({
          name: 'packageA', ver: 'latest',
          dep: dependencyObjectMock.packageA
        })
      )

      let res = dependencies.resolveConflictingVersions(dependecyList)
      expect( res )
        .to.deep.equal( expected_result )

    })

    it('should return only the highest version', () => {

      const dependecyList = [
        {
          name: 'packageA', ver: '1.2.3',
          dep: dependencyObjectMock.packageA
        },
        {
          name: 'packageA', ver: '1.4.2',
          dep: dependencyObjectMock.packageA
        },
        {
          name: 'packageB', ver: 'latest',
          dep: dependencyObjectMock.packageB
        },
        {
          name: 'packageB', ver: '0.0.1',
          dep: dependencyObjectMock.packageB
        }
      ]

      const expected_result = [
        {
          name: 'packageA', ver: '1.4.2',
          dep: dependencyObjectMock.packageA
        },
        {
          name: 'packageB', ver: 'latest',
          dep: dependencyObjectMock.packageB
        }
      ]

      let res = dependencies.resolveConflictingVersions(dependecyList)
      expect( res )
        .to.deep.equal( expected_result )

    })
  })

  describe('.getAllResolved final complete test', () => {

    it('should return the package req (which has no dependencies)', async () => {

      const packageReq = {
        name: 'packageC',
        ver: 'latest'
      }

      const expected_result = [
        {
          name: 'packageC', ver: 'latest',
          dep: dependencyObjectMock.packageC,
          manifest: await getManifestMock({name: 'packageC'})
        }
      ]

      let res = await dependencies.getAllResolved(packageReq, getManifestMock)
      res = res.sort(dependencies.sortByNameKey)

      expect( res )
        .to.deep.equal( expected_result )

    })

    it('should return a correct resolved package list', async () => {

      const packageReq = {
        name: 'packageA',
        ver: 'latest'
      }

      // Edit the dependencyObjectMock to test version resolution
      dependencyObjectMock.packageA.packageB = '1.2.3'
      dependencyObjectMock.packageD.packageB = '1.4.2'

      const expected_result = [
        {
          name: 'packageA', ver: 'latest',
          dep: dependencyObjectMock.packageA,
          manifest: await getManifestMock({name: 'packageA'})
        },
        {
          name: 'packageB', ver: '1.4.2',
          dep: dependencyObjectMock.packageB,
          manifest: await getManifestMock({name: 'packageB'})
        },
        {
          name: 'packageC', ver: 'latest',
          dep: dependencyObjectMock.packageC,
          manifest: await getManifestMock({name: 'packageC'})
        },
        {
          name: 'packageD', ver: 'latest',
          dep: dependencyObjectMock.packageD,
          manifest: await getManifestMock({name: 'packageD'})
        }
      ]

      let res = await dependencies.getAllResolved(packageReq, getManifestMock)
      res = res.sort(dependencies.sortByNameKey)

      expect( res )
        .to.deep.equal( expected_result )

    })
  })

});

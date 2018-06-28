const chai = require('chai');
const expect = require('chai').expect;
const sinon = require('sinon');
const {
  createFetchPackageInfo,
  createGetManifestOfVersions,
  createGetPackageVersions,
} = require('./createFetchPackageInfo');

chai.should();

describe('Call function: fetchPackageInfo', function() {
  describe('[MOCK TEST]', () => {
    const packageName = 'myPackage.eth';
    const packageReq = {name: packageName, ver: 'latest'};
    const versions = [
      {version: '0.0.1'},
      {version: '0.0.2'},
    ];
    const apmGetRepoVersionSpy = sinon.spy();
    const apmMock = {
      getRepoVersions: async (packageName) => {
        apmGetRepoVersionSpy(packageName);
        return versions;
      },
    };

    const ERRORMESSAGE = 'no manifest';
    const getManifestSpy = sinon.spy();
    const getManifestMock = async (packageReq) => {
      getManifestSpy(packageReq);
      if (packageReq.ver == '0.0.1') return 'manifest_0.0.1';
      if (packageReq.ver == '0.0.2') throw Error(ERRORMESSAGE);
    };

    const getPackageVersions = createGetPackageVersions(apmMock);
    const getManifestOfVersions = createGetManifestOfVersions(getManifestMock);
    const fetchPackageInfo = createFetchPackageInfo(getManifestMock, apmMock);

    describe('helper function createGetPackageVersions', function() {
      it('should call apm.getRepoVersions with packageName', async () => {
        let res = await getPackageVersions(packageReq);
        expect(res)
          .to.deep.equal({
            name: packageName,
            versions: versions.reverse(),
          });
      });

      it('should log the package with correct arguments', async () => {
        expect(apmGetRepoVersionSpy.getCalls()[0].args)
          .to.deep.equal( [packageReq] );
      });
    });


    describe('helper function createGetManifestOfVersions', function() {
      it('should return nothing, undefined', async () => {
        let res = await getManifestOfVersions(packageReq, versions);
        expect(res)
          .to.be.undefined;
      });

      it('getManifest should be called twice with two different versions (0.0.1)', () => {
        expect(getManifestSpy.getCalls()[0].args)
          .to.deep.equal( [{
            name: packageName,
            ver: '0.0.1',
          }] );
      });
      it('getManifest should be called twice with two different versions (0.0.2)', () => {
        expect(getManifestSpy.getCalls()[1].args)
          .to.deep.equal( [{
            name: packageName,
            ver: '0.0.2',
          }] );
      });

      it('the versions array should be extended on place, adding manifests', () => {
        expect(versions[0])
          .to.deep.equal( {version: '0.0.1', manifest: 'manifest_0.0.1'} );
      });

      it('the versions array should be extended even if fetching a manifest fails', () => {
        expect(versions[1].manifest.error)
          .to.be.true;
      });
    });


    describe('Call function fetchPackageInfo', function() {
      it('should return success message and packageWithVersions', async () => {
        const args = [packageName];
        let res = await fetchPackageInfo({args});

        let parsedRes = JSON.parse(res);
        expect( parsedRes.success ).to.be.true;
        expect( parsedRes.result.name ).to.equal(packageName);

        let versions = parsedRes.result.versions;
        expect( versions.length ).to.equal(2);
        expect( versions[0].manifest.error ).to.be.true;
        expect( versions[1].manifest ).to.equal('manifest_0.0.1');
      });
    });
  });
});



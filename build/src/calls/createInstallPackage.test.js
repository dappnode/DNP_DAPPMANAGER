const chai = require('chai');
const expect = require('chai').expect;
const sinon = require('sinon');
const createInstallPackage = require('./createInstallPackage');

chai.should();

describe('Call function: installPackage', function() {
  describe('mock test', mockTest);
});

function mockTest() {
  // const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params)
  const packageList = ['a'];
  const PACKAGE_NAME = 'packageA';
  // Create Mocks
  const downloadPackagesSpy = sinon.spy();
  const downloadPackagesMock = async (packageList) => {
    downloadPackagesSpy(packageList);
  };
  const runPackagesSpy = sinon.spy();
  const runPackagesMock = async (packageList) => {
    runPackagesSpy(packageList);
  };
  const getAllDependenciesResolvedOrderedSpy = sinon.spy();
  const getAllDependenciesResolvedOrderedMock = async (packageReq) => {
    getAllDependenciesResolvedOrderedSpy(packageReq);
    return packageList;
  };

  const installPackage = createInstallPackage(getAllDependenciesResolvedOrderedMock,
    downloadPackagesMock,
    runPackagesMock
  );

  let res;

  it('downloadPackages should be called with packageList', async () => {
    // Call only once for efficiency
    res = await installPackage({id: PACKAGE_NAME});

    expect(downloadPackagesSpy.getCalls()[0].args[0].pkg)
      .to.deep.equal( packageList[0] );
  });

  it('runPackages should be called with packageList', () => {
    expect(runPackagesSpy.getCalls()[0].args[0].pkg)
      .to.deep.equal( packageList[0] );
  });

  // it('should stop the package with correct arguments', async () => {
  //   await removePackage([PACKAGE_NAME])
  //   expect(hasRemoved).to.be.true;
  // })

  // it('should throw an error with wrong package name', async () => {
  //   let error = '--- removePackage did not throw ---'
  //   try {
  //     await removePackage(['anotherPackage.dnp.eth'])
  //   } catch(e) {
  //     error = e.message
  //   }
  //   expect(error).to.include('No docker-compose found')
  // })

  it('should return a stringified object containing success', async () => {
    expect(res).to.be.ok;
    expect(res).to.have.property('message');
  });
}

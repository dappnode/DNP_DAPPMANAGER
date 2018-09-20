const proxyquire = require('proxyquire');
const expect = require('chai').expect;
const sinon = require('sinon');
const fs = require('fs');
const logs = require('logs.js')(module);
const {promisify} = require('util');

// With proxyrequire you stub before requiring

const testDirectory = './test_files/';

const PATH_SOURCE = testDirectory+'/hello-world_source.txt';
const HASH = 'QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbKT';
const ipfs = {
    files: {
        add: (PATH, options, callback) => {
            callback(null, [{hash: HASH}]);
        },
        catReadableStream: (HASH) => {
            return fs.createReadStream(PATH_SOURCE);
        },
    },
    pin: {
        add: (HASH, callback) => {
            callback(null, 'great success');
        },
    },
};

// Define test parameters
const params = {
    CACHE_DIR: 'test_files/',
};

const ipfsTasks = proxyquire('modules/ipfs/ipfsTasks', {
    './ipfsSetup': ipfs,
    'params': params,
});

describe('ipfsTasksFactory', () => {
    before('Create test folder', async () => {
        await promisify(fs.mkdir)(testDirectory).catch(logs.error);
    });
    describe('isFileHashValid', () => {
        // Fake only part of the original library
        const PATH1 = testDirectory+'test1';
        const PATH2 = testDirectory+'test2';

        before('Create files for the test', async () => {
            await promisify(fs.writeFile)(PATH1, '', 'utf8').catch(logs.error);
            await promisify(fs.writeFile)(PATH2, 'Something', 'utf8').catch(logs.error);
        });

        it('Should return with an empty file', async () => {
            let res = await ipfsTasks.isfileHashValid(HASH, PATH1);
            expect(res).to.be.false;
        });

        it('Should return true with a correct file and hash', async () => {
            let res = await ipfsTasks.isfileHashValid(HASH, PATH2);
            expect(res).to.be.true;
        });

        it('Should return false with a correct file and wrong hash', async () => {
            let res = await ipfsTasks.isfileHashValid('QmFake', PATH2);
            expect(res).to.be.false;
        });

        after('Remove test files', async () => {
            await promisify(fs.unlink)(PATH1).catch(logs.error);
            await promisify(fs.unlink)(PATH2).catch(logs.error);
        });
    });

    describe('downloadHandler', () => {
        // const ipfs = ipfsAPI('my.ipfs.dnp.dappnode.eth', '5001', {protocol: 'http'});
        const PATH = testDirectory+'hello-world.txt';
        const FILE_CONTENT = 'hello world!';

        before('Create files for the test', async () => {
            await promisify(fs.writeFile)(PATH_SOURCE, FILE_CONTENT, 'utf8').catch(logs.error);
        });

        it('Should download a fake hello-world file', () => {
            const logChunks = () => {};
            return ipfsTasks.downloadHandler(HASH, PATH, logChunks)
            .then(
                (res) => {
                    expect(res).to.be.undefined;
                },
                (err) => {
                    expect(err).to.be.undefined;
                }
            );
        });

        it('Should detect a downloaded file is corrupt', () => {
            const HASH_FAKE = 'QmFake';
            const logChunks = () => {};
            return ipfsTasks.downloadHandler(HASH_FAKE, PATH, logChunks)
            .then(
                (res) => {
                    expect(res).to.be.undefined;
                },
                (err) => {
                    expect(err).to.be.a('String');
                    expect(err).to.include('corrupt');
                }
            );
        });

        it('Should log download progress', () => {
            const logChunks = sinon.stub();
            return ipfsTasks.downloadHandler(HASH, PATH, logChunks)
            .then(
                (res) => {
                    expect(res).to.be.undefined;
                    // Check the logChunks
                    sinon.assert.called(logChunks);
                    const chunk = logChunks.firstCall.lastArg;
                    expect(chunk instanceof Buffer);
                    expect(String(chunk)).to.equal(FILE_CONTENT);
                }, (err) => {
                    expect(err).to.be.undefined;
                }
            );
        });

        after('Remove test files', async () => {
            await promisify(fs.unlink)(PATH_SOURCE).catch(logs.error);
        });
    });

    describe('cat & download', () => {
        const FILE_CONTENT = 'hello world!';
        const PATH = testDirectory+'hello-world.txt';

        before('Create files for the test', async () => {
            await promisify(fs.writeFile)(PATH_SOURCE, FILE_CONTENT, 'utf8').catch(logs.error);
        });

        it('Should download a fake hello-world file', () => {
            const HASH = 'QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbKT';
            return ipfsTasks.download(HASH, PATH)
            .then(
                (res) => {
                    expect(res).to.be.undefined;
                    expect(fs.readFileSync(PATH, 'utf8')).to.equal(FILE_CONTENT);
                },
                (err) => {
                    expect(err.stack).to.be.undefined;
                }
            );
        });

        it('Should cat a fake hello-world file', () => {
            const HASH = 'QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbKT';
            return ipfsTasks.cat(HASH)
            .then(
                (res) => {
                    expect(res).to.equal(FILE_CONTENT);
                },
                (err) => {
                    expect(err).to.be.undefined;
                }
            );
        });

        after('Remove test files', async () => {
            await promisify(fs.unlink)(PATH_SOURCE).catch(logs.error);
            await promisify(fs.unlink)(PATH).catch(logs.error);
        });
    });
    after('Remove test directory', async () => {
        await promisify(fs.rmdir)(testDirectory).catch(logs.error);
    });
});


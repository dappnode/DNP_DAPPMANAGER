const proxyquire = require('proxyquire');
const expect = require('chai').expect;
const sinon = require('sinon');
const fs = require('fs');

// With proxyrequire you stub before requiring

const PATH_SOURCE = './test/hello-world_source.txt';
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
};

// Define test parameters
const params = {
    CACHE_DIR: 'test/',
};

const ipfsTasks = proxyquire('./ipfsTasks', {
    './ipfsSetup': ipfs,
    'params': params,
});

describe('ipfsTasksFactory', () => {
    describe('isFileHashValid', () => {
        // Fake only part of the original library
        const PATH1 = './test/test1';
        const PATH2 = './test/test2';

        before('Create files for the test', () => {
            fs.writeFileSync(PATH1, '', 'utf8');
            fs.writeFileSync(PATH2, 'Something', 'utf8');
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
    });

    describe('isFileHashValid', () => {
        // Fake only part of the original library
        const PATH1 = './test/test1';
        const PATH2 = './test/test2';

        before('Create files for the test', () => {
            fs.writeFileSync(PATH1, '', 'utf8');
            fs.writeFileSync(PATH2, 'Something', 'utf8');
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
    });

    describe('downloadHandler', () => {
        // const ipfs = ipfsAPI('my.ipfs.dnp.dappnode.eth', '5001', {protocol: 'http'});
        const PATH = './test/hello-world.txt';
        const FILE_CONTENT = 'hello world!';

        before('Create files for the test', () => {
            fs.writeFileSync(PATH_SOURCE, FILE_CONTENT, 'utf8');
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
                    expect(err).to.be.an('Error');
                    expect(err.message).to.include('corrupt');
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
    });

    describe('cat & download', () => {
        const FILE_CONTENT = 'hello world!';

        before('Create files for the test', () => {
            fs.writeFileSync(PATH_SOURCE, FILE_CONTENT, 'utf8');
        });

        it('Should download a fake hello-world file', () => {
            const PATH = './test/hello-world.txt';
            const HASH = 'QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbKT';
            fs.unlinkSync(PATH);
            return ipfsTasks.download(HASH, PATH)
            .then(
                (res) => {
                    expect(res).to.be.undefined;
                    expect(fs.readFileSync(PATH, 'utf8')).to.equal(FILE_CONTENT);
                },
                (err) => {
                    expect(err).to.be.undefined;
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
    });
});


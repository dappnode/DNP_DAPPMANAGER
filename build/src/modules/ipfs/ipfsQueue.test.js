const expect = require('chai').expect;
const sinon = require('sinon');

const ipfsQueueFactory = require('./ipfsQueue');

describe('ipfsQueueFactory', function() {
    // Download, fails once and then resolves
    let download = sinon.stub();
    download.onCall(0).returns(Promise.reject('error'));
    download.onCall(1).returns(Promise.resolve('result'));
    // Cat will fail always
    let cat = sinon.stub();
    cat.returns(Promise.reject('error'));
    const ipfsTasks = {
        download,
        cat,
    };
    const retryAttempts = 2;
    const concurrency = 2;
    const intervalBase = 1; // = 1ms, to speed up tests
    const options = {
        retryAttempts,
        concurrency,
        intervalBase,
    };
    const ipfsQueue = ipfsQueueFactory({ipfsTasks, options});

    it('Should call download twice and finally return an success', async () => {
        let res = await ipfsQueue.download({});
        expect(res).to.equal('result');
        sinon.assert.callCount(download, retryAttempts);
    });

    it('Should call cat twice and finally return an error', () => {
        return ipfsQueue.cat({})
        .catch((err) => {
            expect(err.message).to.equal('error');
            sinon.assert.callCount(cat, retryAttempts);
        });
    });
});


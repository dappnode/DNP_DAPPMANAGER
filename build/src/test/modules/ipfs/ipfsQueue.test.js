const proxyquire = require('proxyquire');
const expect = require('chai').expect;
const sinon = require('sinon');

// With proxyrequire you stub before requiring

// Download, fails once and then resolves
const download = sinon.stub();
download.onCall(0).returns(Promise.reject('error'));
download.onCall(1).returns(Promise.resolve('result'));
// Cat will fail always
const cat = sinon.stub();
cat.returns(Promise.reject('error'));

const ipfsTasks = {
    download,
    cat,
};

const times = 2;

const ipfsQueue = proxyquire('modules/ipfs/ipfsQueue', {
    './ipfsTasks': ipfsTasks,
    './ipfsParams': {
        times,
        concurrency: 2,
        intervalBase: 1, // = 1ms, to speed up tests
    },
});

describe('ipfsQueueFactory', function() {
    it('Should call download twice and finally return an success', async () => {
        let res = await ipfsQueue.download({});
        expect(res).to.equal('result');
        sinon.assert.callCount(download, times);
    });

    it('Should call cat twice and finally return an error', () => {
        return ipfsQueue.cat({})
        .catch((err) => {
            expect(err.message).to.equal('error');
            sinon.assert.callCount(cat, times);
        });
    });
});


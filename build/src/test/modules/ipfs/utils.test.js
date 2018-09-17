const expect = require('chai').expect;

const utils = require('modules/ipfs/utils');

describe('ipfsTasksFactory', () => {
    const HASH = 'QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbKT';

    describe('parseResHash', () => {
        it('To parse correctly', () => {
            const res = [{hash: 'Qm'}];
            let hash = utils.parseResHash(res);
            expect(hash).to.equal('Qm');
        });

        it('To throw if res is incorrect', () => {
            const res = [{hashFake: 'Qm'}];
            expect(function() {
                utils.parseResHash(res);
            }).to.throw();
        });
    });

    describe('validateIpfsHash', () => {
        it('To parse correctly', () => {
            let _HASH = utils.validateIpfsHash('/ipfs/'+HASH);
            expect(_HASH).to.equal(HASH);
        });

        it('To throw if res is incorrect', () => {
            const HASH_BROKEN = 'QmFaKe';
            expect(function() {
                utils.validateIpfsHash(HASH_BROKEN);
            }).to.throw();
        });
    });
});


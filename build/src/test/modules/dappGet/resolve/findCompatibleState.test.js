const proxyquire = require('proxyquire');
const expect = require('chai').expect;

/* eslint-disable max-len */

/**
 * Purpose of the test. Make sure the DNPs are ordered correctly
 *
 * Rules to prioritize DNPs:
 * 1. Requested package, newest first
 * 2. State package, oldest first
 * 3. New packages, newest first.
 * + Prioritize not installing new packages, first version = null.
 */

const findCompatibleState =
    proxyquire('modules/dappGet/resolve/findCompatibleState', {
});

describe('dappGet/resolve/findCompatibleState', () => {
    it('Should find a compatible state for a standard case', async () => {
        const dnps = {
            'dependency.dnp.dappnode.eth': {
              versions: {
                '0.1.1': {},
                '0.1.2': {},
              },
            },
            'letsencrypt-nginx.dnp.dappnode.eth': {
              isInstalled: true,
              versions: {
                '0.0.4': {'web.dnp.dappnode.eth': '*'},
              },
            },
            'nginx-proxy.dnp.dappnode.eth': {
              isRequest: true,
              versions: {
                '0.0.3': {'dependency.dnp.dappnode.eth': '*'},
              },
            },
            'web.dnp.dappnode.eth': {
              isInstalled: true,
              versions: {
                '0.1.0': {'letsencrypt-nginx.dnp.dappnode.eth': '*'},
              },
            },
          };
        const result = findCompatibleState(dnps);
        expect(result.success).to.be.ok;
        expect(result.message).to.equal(
            'Found compatible state with case 2/3'
        );
        expect(result.success).to.deep.equal({
            'dependency.dnp.dappnode.eth': '0.1.2',
            'letsencrypt-nginx.dnp.dappnode.eth': '0.0.4',
            'nginx-proxy.dnp.dappnode.eth': '0.0.3',
            'web.dnp.dappnode.eth': '0.1.0',
        });
    });

    it('Should find a compatible state for an extremely simple case', async () => {
        const dnps = {
            'kovan.dnp.dappnode.eth': {
              isRequest: true,
              versions: {
                '0.1.1': {},
              },
            },
          };
        const result = findCompatibleState(dnps);
        expect(result.success).to.be.ok;
        expect(result.message).to.equal(
            'Found compatible state with case 1/1'
        );
        expect(result.success).to.deep.equal({
            'kovan.dnp.dappnode.eth': '0.1.1',
        });
    });

    it('Should find a compatible state a involving IPFS hashes', async () => {
        const dnps = {
            'lnd.dnp.dappnode.eth': {
              isRequest: true,
              versions: {
                '/ipfs/QmV33iaboYzMgtcKur9JXbRmvkeeKbQSav8DSk1Emeyw1X': {
                    'bitcoind.dnp.dappnode.eth': '/ipfs/QmbPVaVVLHoFyJyzxHmok9kJYFAzq6R2UBvhEAuAQYc3ws',
                },
              },
            },
            'bitcoind.dnp.dappnode.eth': {
                isInstalled: true,
                versions: {
                    '/ipfs/QmbPVaVVLHoFyJyzxHmok9kJYFAzq6R2UBvhEAuAQYc3ws': {},
                    '0.1.0': {},
                    '0.1.1': {},
                    '0.1.2': {},
                    '0.1.3': {},
                },
            },
          };
        const result = findCompatibleState(dnps);
        expect(result.success).to.be.ok;
        expect(result.message).to.equal(
            'Found compatible state with case 1/5'
        );
        expect(result.success).to.deep.equal({
            'bitcoind.dnp.dappnode.eth': '/ipfs/QmbPVaVVLHoFyJyzxHmok9kJYFAzq6R2UBvhEAuAQYc3ws',
            'lnd.dnp.dappnode.eth': '/ipfs/QmV33iaboYzMgtcKur9JXbRmvkeeKbQSav8DSk1Emeyw1X',
        });
    });
});


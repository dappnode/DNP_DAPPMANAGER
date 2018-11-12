const proxyquire = require('proxyquire');
const expect = require('chai').expect;
const semver = require('semver');

/**
 * Purpose of the test. Make sure it is able to pick up
 * relevant installed packages
 *
 * REQ: 'nginx-proxy.dnp.dappnode.eth'
 * DEPS:
 * - 'web.dnp.dappnode.eth' => 'nginx-proxy.dnp.dappnode.eth'
 * - 'web.dnp.dappnode.eth' => 'letsencrypt-nginx.dnp.dappnode.eth'
 * - 'letsencrypt-nginx.dnp.dappnode.eth' => 'web.dnp.dappnode.eth'
 *
 * Should be able to return 'web.dnp.dappnode.eth' and 'letsencrypt-nginx.dnp.dappnode.eth'
 * Also should not crash due to a dependency loop
 */

const getRelevantInstalledPackages =
    proxyquire('modules/dappGet/fetch/getRelevantInstalledPackages', {
});

describe('dappGet/state/fetchState', () => {
    it('should request correct ranges and ignore wierd versions', async () => {
        const dnpList = getDnpList();
        const installedPackages = dnpList
            // Only consider valid versions, ignore:
            // - pkg.dnp.dappnode.eth:dev
            // - pkg.dnp.dappnode.eth:c5ashf61
            .filter((pkg) => semver.valid(pkg.version));

        const requestedPackages = [
            'nginx-proxy.dnp.dappnode.eth',
        ];
        const relevantInstalledPackages = getRelevantInstalledPackages(
            requestedPackages,
            installedPackages
        );

        const resultPkgNames = relevantInstalledPackages.map((pkg) => pkg.name);
        expect(resultPkgNames)
        .to.deep.equal([
            'web.dnp.dappnode.eth',
            'letsencrypt-nginx.dnp.dappnode.eth',
        ]);
    });
});

function getDnpList() {
    return [{id:
        '15ac62df5fadca3f63235d5deddfdc5e9a0bf096ac05d3b06b9c5e1e7ae801e5',
       version: '0.0.0',
       origin: '/ipfs/Qmb3L7wgoJ8UvduwcwjqUudcEnZgXKVAZvQ8rNE5L6vR34',
       dependencies: {
           'nginx-proxy.dnp.dappnode.eth': 'latest',
           'letsencrypt-nginx.dnp.dappnode.eth': 'latest',
        },
       isDNP: false,
       isCORE: true,
       created: '2018-11-07T09:14:12.000Z',
       image: 'alpine',
       name: 'web.dnp.dappnode.eth',
       shortName: 'web',
       ports: '',
       state: 'exited',
       running: false},
     {id:
        '9c189f409269e55784c1e5195392c2c73b2e370bf77f59f1ba068d6ef4fed1b1',
       version: '0.1.16',
       origin: undefined,
       dependencies: undefined,
       isDNP: false,
       isCORE: true,
       created: '2018-10-26T19:51:20.000Z',
       image: 'vpn.dnp.dappnode.eth:0.1.16',
       name: 'vpn.dnp.dappnode.eth',
       shortName: 'vpn',
       ports: '',
       state: 'created',
       running: true},
     {id:
        '57a13d37f2ea746c2d879d2bfaac4e197bf5886b595931b21b03c1d2d9342cb7',
       version: '0.1.5',
       origin: undefined,
       dependencies: undefined,
       isDNP: false,
       isCORE: true,
       created: '2018-10-26T19:51:20.000Z',
       image: 'bind.dnp.dappnode.eth:0.1.5',
       name: 'bind.dnp.dappnode.eth',
       shortName: 'bind',
       ports: '',
       state: 'created',
       running: true},
     {id:
        '1e5ef1446b8d4a7c397fc059a64276e9d6a6301618175e5881be63fcf8c0f6a8',
       version: '0.1.7',
       origin: undefined,
       dependencies: undefined,
       isDNP: false,
       isCORE: true,
       created: '2018-10-26T19:51:20.000Z',
       image: 'core.dnp.dappnode.eth:0.1.7',
       name: 'core.dnp.dappnode.eth',
       shortName: 'core',
       ports: '',
       state: 'created',
       running: true},
     {id:
        '8c27f67aaa6fd3db495195de29fb6d28570660d02aaa923a9633a64b0fd71302',
       version: '0.1.0',
       origin: undefined,
       dependencies: undefined,
       isDNP: false,
       isCORE: true,
       created: '2018-10-26T19:51:19.000Z',
       image: 'wamp.dnp.dappnode.eth:0.1.0',
       name: 'wamp.dnp.dappnode.eth',
       shortName: 'wamp',
       ports: '',
       state: 'created',
       running: true},
     {id:
        'f3a5bda88b6d708d17d86ddeeaa3ce40b5f0d805dee5dff5f7ace6833ff112ab',
       version: '0.1.12',
       origin: undefined,
       dependencies: undefined,
       isDNP: false,
       isCORE: true,
       created: '2018-10-26T19:51:19.000Z',
       image: 'admin.dnp.dappnode.eth:0.1.12',
       name: 'admin.dnp.dappnode.eth',
       shortName: 'admin',
       ports: '',
       state: 'created',
       running: true},
     {id:
        '52a2508f0d460e9e0ee5b8852587c2accbcf176426765243f15c3c1c3dba58af',
       version: '0.1.3',
       origin: undefined,
       dependencies: undefined,
       isDNP: false,
       isCORE: true,
       created: '2018-10-26T19:51:19.000Z',
       image: 'ipfs.dnp.dappnode.eth:0.1.3',
       name: 'ipfs.dnp.dappnode.eth',
       shortName: 'ipfs',
       ports: '',
       state: 'created',
       running: true},
     {id:
        '2d9d3c80dfd70a4bd4166c2fa0730f9f688e399bce6601c072baf15dc3f991cd',
       version: '0.1.8',
       origin: undefined,
       dependencies: undefined,
       isDNP: false,
       isCORE: true,
       created: '2018-10-26T19:51:19.000Z',
       image: 'ethchain.dnp.dappnode.eth:0.1.8',
       name: 'ethchain.dnp.dappnode.eth',
       shortName: 'ethchain',
       ports: '',
       state: 'created',
       running: true},
     {id:
        '12b05ca6c0f84d6b0bd8e0202ab4eee9b4babaf5fa35cabb7ab4fde30a0accef',
       version: '0.1.2',
       origin: undefined,
       dependencies: undefined,
       isDNP: false,
       isCORE: true,
       created: '2018-10-26T19:51:19.000Z',
       image: 'ethforward.dnp.dappnode.eth:0.1.2',
       name: 'ethforward.dnp.dappnode.eth',
       shortName: 'ethforward',
       ports: '',
       state: 'created',
       running: true},
     {id:
        '057d8297d2c4217c3ea2330e3b0314030a192165ecc0cdbe8e13299aa9942bd5',
       version: '0.0.3',
       origin: undefined,
       dependencies: undefined,
       isDNP: true,
       isCORE: false,
       created: '2018-10-26T19:30:52.000Z',
       image: 'otpweb.dnp.dappnode.eth:0.0.3',
       name: 'otpweb.dnp.dappnode.eth',
       shortName: 'otpweb',
       ports: '->80',
       state: 'exited',
       running: false},
     {id:
        '64f45a03eb6af08c0c40e8b49a120359252a7aba87f61d5d37480b6d045b762b',
       version: '0.0.3',
       origin: undefined,
       dependencies: {'nginx-proxy.dnp.dappnode.eth': 'latest'},
       isDNP: true,
       isCORE: false,
       created: '2018-10-07T00:01:38.000Z',
       image: 'nginx-proxy.dnp.dappnode.eth:0.0.3',
       name: 'nginx-proxy.dnp.dappnode.eth',
       shortName: 'nginx-proxy',
       ports: '443->443, 80->80',
       state: 'exited',
       running: false},
     {id:
        '9bd4ef727f9d5bfe70098613acda35b00491bd125ed1e8b96d637aa496e88b9f',
       version: '0.0.4',
       origin: undefined,
       dependencies: {'web.dnp.dappnode.eth': 'latest'},
       isDNP: true,
       isCORE: false,
       created: '2018-10-07T00:01:38.000Z',
       image: 'letsencrypt-nginx.dnp.dappnode.eth:0.0.4',
       name: 'letsencrypt-nginx.dnp.dappnode.eth',
       shortName: 'letsencrypt-nginx',
       ports: '',
       state: 'exited',
       running: false}];
}

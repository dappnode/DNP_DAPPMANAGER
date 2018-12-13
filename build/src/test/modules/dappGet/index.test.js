const proxyquire = require('proxyquire');
const expect = require('chai').expect;
const sinon = require('sinon');

/* eslint-disable max-len */

/**
 * Purpose of the test. Make sure packages are moved to the alreadyUpgraded object
 */

const dnpList = getDnpList();
const dockerList = {
    listContainers: sinon.stub().callsFake(async () => {
        return dnpList;
    }),
};

const aggregate = sinon.stub().callsFake(async ({req, dnpList}) => {
    return {};
});

const resolve = sinon.stub().callsFake(({dnp}) => {
    return {
        success: {
            'nginx-proxy.dnp.dappnode.eth': '0.0.4',
            'letsencrypt-nginx.dnp.dappnode.eth': '0.0.4',
            'web.dnp.dappnode.eth': '0.1.0',
        },
    };
});

const dappGet =
    proxyquire('modules/dappGet', {
        './aggregate': aggregate,
        './resolve': resolve,
        'modules/dockerList': dockerList,
    });

describe('dappGet', () => {
    let result;
    it('Should call dappGet without crashing', async () => {
        result = await dappGet({
            name: 'nginx-proxy.dnp.dappnode.eth',
            ver: '^0.1.0',
        });
    });

    it('Should call list containers once', () => {
        sinon.assert.calledOnce(dockerList.listContainers);
    });

    it('Should add packages to the alreadyUpdated object', () => {
        expect(result).to.deep.equal({
            alreadyUpdated: {
                'letsencrypt-nginx.dnp.dappnode.eth': '0.0.4',
                'web.dnp.dappnode.eth': '0.1.0',
            },
            success: {
               'nginx-proxy.dnp.dappnode.eth': '0.0.4',
            },
        });
    });
});

function getDnpList() {
    return [
        {
            dependencies: {
                'nginx-proxy.dnp.dappnode.eth': 'latest',
                'letsencrypt-nginx.dnp.dappnode.eth': 'latest',
            },
            name: 'web.dnp.dappnode.eth',
            version: '0.1.0',
            origin: undefined,
        },
        {
            dependencies: {'nginx-proxy.dnp.dappnode.eth': 'latest'},
            name: 'nginx-proxy.dnp.dappnode.eth',
            version: '0.0.3',
            origin: undefined,
        },
        {
            dependencies: {'web.dnp.dappnode.eth': 'latest'},
            name: 'letsencrypt-nginx.dnp.dappnode.eth',
            version: '0.0.4',
            origin: '/ipfs/Qm1234',
        },
    ];
}

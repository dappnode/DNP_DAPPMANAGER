const proxyquire = require('proxyquire');
const expect = require('chai').expect;

/**
 * Purpose of the test. Make sure dappGet/fetch fetches the correct versions:
 * - It should fetch the manifest of the request
 * - It should fetch the manifest of the request's depedencies
 * - It should realize that an installed package is a dependant of a requested depedency
 *   then fetch the manifest of the dependant
 */

let resultRepo;

const fetch = proxyquire('modules/dappGet/fetch', {
    './getPkgDeps': getPkgDeps,
    '../utils/getRepo': async () => ({}),
    '../utils/setRepo': async (repo) => {
        resultRepo = repo;
    },
    'modules/dockerList': {
        listContainers: async () => {
            return getDnpList();
        },
    },
});

describe('dappGet/fetch', () => {
    it('should fetch the necessary manifests given a specific request', async () => {
        const req = {name: 'request.dnp.dappnode.eth', ver: '0.1.0'};
        await fetch(req);
        // .to.have.members:
        // Asserts that the target array has the same members as the given array set.
        expect(Object.keys(resultRepo)).to.have.members([
            'request.dnp.dappnode.eth',
            'dependency.dnp.dappnode.eth',
            'dependant.dnp.dappnode.eth',
        ]);
    });
});

async function getPkgDeps(name, ver, repo) {
    // Simulte repo initialization
    if (!repo[name]) repo[name] = {};
    if (!repo[name][ver]) {
        repo[name][ver] = {
            name,
            version: ver,
        };
    }

    // Simulate dependency fetching. Hardcoded dep relations
    // request.dnp.dappnode.eth => dependency.dnp.dappnode.eth
    // dependant.dnp.dappnode.eth => dependency.dnp.dappnode.eth
    if (name === 'request.dnp.dappnode.eth') {
        repo[name][ver].dependencies = {
            'dependency.dnp.dappnode.eth': '0.1.0',
        };
    } else if (name === 'dependant.dnp.dappnode.eth') {
        repo[name][ver].dependencies = {
            'dependency.dnp.dappnode.eth': '0.1.0',
        };
    } else {
        repo[name][ver].dependencies = {};
    }

    // Simulate the recursive fetching
    // It does not have a protection against dependency loops
    Object.keys(repo[name][ver].dependencies).forEach((depName) => {
        getPkgDeps(depName, repo[name][ver].dependencies[depName], repo);
    });
}

function getDnpList() {
    // Simulate the docker call to get the currently installed packages
    return [
        {
            version: '0.1.0',
            origin: '/ipfs/Qmb3L7wgoJ8UvduwcwjqUudcEnZgXKVAZvQ8rNE5L6vR34',
            dependencies: {'dependency.dnp.dappnode.eth': 'latest'},
            name: 'dependant.dnp.dappnode.eth',
        },
        {
            version: '0.1.0',
            origin: null,
            dependencies: null,
            name: 'dependency.dnp.dappnode.eth',
        },
    ];
}



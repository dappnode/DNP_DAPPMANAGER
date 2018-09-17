

/**
 * Computes key parameters to construct all version permutations
 *
 * @param {object} pkgToInstall An object with the list of packages to install
 * the properties are names of packages which contain an object with possible versions
 * { A: ['2.0.0', '2.1.0', '2.2.0'],
 *   C: ['2.0.0', '1.0.0'],
 *   D: ['1.0.0', '1.1.0']
 * }
 * @param {string} name requested package name / ID
 * @param {object} state Current version of installed packages
 * { A: '1.0.0',
 *   C: '2.0.0' }
 * @return {array} Array of length = # of packages with key parameters
 * to compute their permutation. The ordering of the versions is done careful
 * to test first the states with higher priority. 'm' is the total # of permutations
 * { x: [ { pkg: 'A', vers: [ '2.2.0', '2.1.0', '2.0.0' ], n: 3, m: 1 },
 *        { pkg: 'C', vers: [ '2.0.0', '1.0.0' ], n: 2, m: 3 },
 *        { pkg: 'D', vers: [ '1.1.0', '1.0.0' ], n: 2, m: 6 }
 *      ],
 *   m: 12
 * }
 */
function getPermutationsTable(pkgToInstall, name, state) {
    let m = 1;
    const isState = (pkg) => Object.keys(state).includes(pkg);
    return {
        x: Object.keys(pkgToInstall)
        // This sort is extremely important. It prioritizes the first successful version
        // The sort orders the priority criterias as follows
        // - The requested package has the highest version
        // - The already installed packages have the closest version to the current one
        // - Newly installed packages have the highest versions
        // If a package is at the end of the array, its first version will be tested
        // against all possible permutations
        // Order 1          Order 2
        // [A, B]           [B, A]
        // {A: 1, B: 1}     {B: 1, A: 1}
        // {A: 2, B: 1}     {B: 2, A: 1}
        // {A: 1, B: 2}     {B: 1, A: 2}
        // {A: 2, B: 2}     {B: 2, A: 2}
        // It is more for A to have a specific version than B, Order 2 should be followed
        .sort((pkgA, pkgB) => {
            if (pkgA === name) return 1;
            else if (pkgB === name) return -1;
            else if (isState(pkgA) && !isState(pkgB)) return 1;
            else if (!isState(pkgA) && isState(pkgB)) return -1;
            else return 0;
        })
        .map((pkg) => {
            const vers = pkgToInstall[pkg];
            const n = vers.length;
            const res = {pkg, vers, n, m};
            m = m * n;
        return res;
        }),
        m,
    };
}

/**
 * Computes the # i permutation of package versions of the set defined by x.
 *
 * @param {array} x Array of length = # of packages with key parameters
 * to compute their permutation. The ordering of the versions is done careful
 * to test first the states with higher priority. 'm' is the total # of permutations
 * [ { pkg: 'A', vers: [ '2.2.0', '2.1.0', '2.0.0' ], n: 3, m: 1 },
 *   { pkg: 'C', vers: [ '2.0.0', '1.0.0' ], n: 2, m: 3 },
 *   { pkg: 'D', vers: [ '1.1.0', '1.0.0' ], n: 2, m: 6 }
 * ]
 * @param {integer} i #th permutation
 * @return {object} A state with a specific set of versions
 * { A: '2.2.0', C: '2.0.0', D: '1.1.0' }
 */
function getPermutation(x, i) {
    let obj = {};
    for (const pkg of x) {
        obj[pkg.pkg] = pkg.vers[Math.floor(i/pkg.m)%pkg.n];
    }
    return obj;
}

module.exports = {
    getPermutation,
    getPermutationsTable,
};

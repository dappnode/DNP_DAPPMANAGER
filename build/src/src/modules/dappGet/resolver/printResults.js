function printResults({success, errors, casesChecked, totalCases, hasTimedOut}) {
    if (hasTimedOut) {
        console.log('TIMED OUT!');
    }
    console.log('checked '+casesChecked+' / '+totalCases+' total cases');

    // Plot results
    const printResult = (arr) => arr.map((s) => (s+'     ').substring(0, 6)).join('  ');
    if (success) {
        console.log(printResult(['i', ...Object.keys(success)]));
        console.log(printResult([0, ...Object.values(success)]));
    } else {
        console.log('NO SOLUTIONS, BLAME:');

        let deps = {};
        let pkgs = {};
        Object.keys(errors).forEach((key) => {
            const [req, dep, range] = key.split('#');
            let depName = dep.split('@')[0];
            let pkgName = req.split('@')[0];
            deps[depName] = deps[depName] || 0 + errors[key];
            pkgs[pkgName] = pkgs[pkgName] || 0 + errors[key];
        });

        const normalize = (obj) => {
            let total = 0;
            Object.values(obj).forEach((val) => total += val);
            Object.keys(obj).forEach((key) => {
                obj[key] = obj[key]/total;
            });
            return obj;
        };

        console.log('DEP\n', normalize(deps));
        console.log('PKG\n', normalize(pkgs));
    }
}

module.exports = printResults;


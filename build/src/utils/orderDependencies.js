

function orderDependencies(packageList) {
  // Expects an array of objects
  // [{
  //   name: 'packageA'
  //   dep: {packageB: 'latest', packageB: 'latest'}
  // },
  // {
  //   name: 'packageB'
  //   dep: {}
  // }]

  // Validate
  if (!Array.isArray(packageList)) {
    throw Error('packageList is not an array, packageList: '+JSON.stringify(packageList));
  }

  packageList.map((pkg) => {
    if (!pkg.hasOwnProperty('name')) {
      throw Error('packageList pkg does not contain a name key, pkg: '+JSON.stringify(pkg));
    }

    if (!pkg.hasOwnProperty('dep')) {
      throw Error('packageList pkg does not contain a dep  key, pkg: '+JSON.stringify(pkg));
    }

    if (Array.isArray(pkg.dep)) {
      throw Error('packageList pkg.dep should not be an array, pkg.dep: '+JSON.stringify(pkg.dep));
    }
  });

  // create registry
  let registry = createRegistry(packageList);

  // construct an array with ordered names of packages
  let order = [];

  let count = 0;
  while (!mulBool(Object.values(registry))) {
    resolve(packageList, registry, order);
    if (count++ > 100) throw Error('Resolver counter exceeded safe limit');
  }

  return order;
}

function createRegistry(packageList) {
  let registry = {};
  packageList.map((pkg) => registry[pkg.name] = false);
  return registry;
}

function resolve(packageList, registry, order) {
  packageList.map(function(pkg) {
    if (check(pkg.dep, registry) && !registry[pkg.name]) {
      order.push(pkg);
    }
    registry[pkg.name] = check(pkg.dep, registry);
  });
}

function check(depObj, registry) {
  let depArr = Object.getOwnPropertyNames(depObj);
  if (!depArr.length) return true;
  return mulBool(depArr
  .map(function(e) {
    return registry[e];
  })
  );
}

function mulBool(arr) {
  return arr.reduce(function(a, b) {
    return Boolean(a * b);
  });
}


module.exports = {
  resolve,
  check,
  mulBool,
  createRegistry,
  orderDependencies,
};

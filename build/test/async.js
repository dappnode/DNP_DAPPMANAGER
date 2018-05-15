
// downloadPackagesInParalel([
//   {name: 'A'},
//   {name: 'B'},
//   {name: 'C'}
// ])

runPackages([
  {name: 'A'},
  {name: 'B'},
  {name: 'C'}
])

async function runPackages(packageList) {
  for (const pkg of packageList) {
    console.log('Started: '+pkg.name)
    await delay()
    console.log('Finishd: '+pkg.name)
  }
}

async function downloadPackagesInParalel(packageList) {
  // Expects and array of package objects
  // [
  //   {
  //     name: 'packageA',
  //     ver: 'latest'
  //   },
  //   ...
  // ]
  let res = await Promise.all(packageList.map(download))

  async function download (pkg) {
    console.log('Started: '+pkg.name)
    await delay()
    console.log('Finishd: '+pkg.name)
    return 'hello from '+pkg.name
  }

  console.log(res)

}


function delay() {
    return new Promise(resolve => {
        setTimeout(resolve, Math.random() * 1000);
    });
}

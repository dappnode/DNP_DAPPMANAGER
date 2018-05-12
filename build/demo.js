
let packages = [
  {
    name: 'otpweb',
    versions: [
      {
        version: '1',
        hash: '3242jh4bj2'
      },
      {
        version: '2',
        hash: 'j14norip43r'
      }
    ]
  },
  {
    name: 'nginx',
    versions: [
      {
        version: '3',
        hash: '9c8usd098cjs'
      },
      {
        version: '4',
        hash: 'p3k4pomifn43'
      }
    ]
  }
]




// resolvePackages(packages)
init()

async function init() {
  let x = await resolvePackages(packages)
  console.log(JSON.stringify(packages, null, 2))
}

async function resolvePackages(packages) {
  let versionsArray = await Promise.all(
    packages.map(_package => getManifestOfVersions(_package.versions))
  )
}

async function getManifestOfVersions(versions) {
  let manifests = await Promise.all(
    versions.map(version => getSomething(version))
  )
}



async function getSomething(version) {
  let x = version.version
  console.log('srt '+x)
  await timer()
  console.log('end '+x)
  version.manifest = x+' fetched'
}

function timer() {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, Math.floor(1000*Math.random()));
  });
}

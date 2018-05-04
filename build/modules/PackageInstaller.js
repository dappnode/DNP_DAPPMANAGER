// dedicated modules
const dependenciesTools = require('./tools/dependenciesTools')
const emitter = require('./emitter')
const image = require('./imageManager')


function PackageInstaller (packageName) {

  console.log('##\n REQUESTING: '+packageName)

  this.name = packageName
  this.dependencyList = []
  this.installedPackages = []
  this.launch = async function() {

    // Load the dependency list for this specific package
    this.dependencyList = await dependenciesTools.getNames(packageName)
    // Watch which dependencies are installed
    this.watchDependencies()
    // Start installation
    await this.download()
    await this.dependencies()
    await this.install()

  }

  this.download = async function() {

    await image.download(packageName)

  }

  this.watchDependencies = function() {

    let _this = this
    emitter.on('packageInstalled', (_packageName) => {
      _this.installedPackages.push(_packageName)
    })

  }
  this.dependencies = function() {

    let _this = this

    return new Promise((resolve) => {
      let watchLoop = setInterval(function(){
        if (arrayContainsAnotherArray(_this.dependencyList, _this.installedPackages)) {
          clearInterval(watchLoop)
          resolve()
        }
      }, 1000)
    })

  }

  this.install = async function() {

    await image.load(packageName)
    await image.run(packageName)
    emitter.emit('packageInstalled', packageName.split('@')[0])

  }
}

module.exports = PackageInstaller

// UTILS

function arrayContainsAnotherArray(needle, haystack){
  for(var i = 0; i < needle.length; i++){
    if(haystack.indexOf(needle[i]) === -1)
       return false
  }
  return true
}

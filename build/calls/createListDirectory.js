

function createListDirectory(getDirectory) {

  return async function listDirectory() {

      let packages = await getDirectory()

      return JSON.stringify({
          success: true,
          message: "Listing " + packages.length + " packages",
          result: packages
      })

  }

}



module.exports = createListDirectory

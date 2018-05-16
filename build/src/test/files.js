const fs = require('fs')
const base64Img = require('base64-img')

init()
async function init() {
  var data = base64Img.base64Sync('avatar')
  console.log(data)
}

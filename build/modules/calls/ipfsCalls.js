// node modules
const fs = require('fs')
const through = require('through2')
const createError = require('create-error')

// dedicated modules
const params = require('../../params')
const ipfs = require('./setup/ipfsSetup')

// Define custom errors

const IPFSError = createError('IPFSError')
const CACHE_DIR = params.CACHE_DIR

// Define parameters

let maxAttempts = 3
let timeoutTime = 3000
let waitingTimeBetweenAttempts = 1000

// Main functions

async function cat(hash) {

  let FILE_PATH = CACHE_DIR + hash

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR)
  }

  if (fs.existsSync(FILE_PATH)) {
    return fs.readFileSync(FILE_PATH, 'utf8')
  } else {
    await download(hash, FILE_PATH)
    return fs.readFileSync(FILE_PATH, 'utf8')
  }

}


async function download(hash, path, log=console.log) {

  // Make sure hash if valid
  if(!hash.startsWith('Qm')) {
    throw Error('Invalid IPFS hash: ' + hash)
  }

  for (let i = 0; i < maxAttempts; i++) {

    try {

      await handleDownload(hash, path, log)
      console.log('#### Download attempt n# '+i+' succeeded')
      return

    } catch(error) {

      if (error instanceof IPFSError) {
        console.log('#### Download attempt n# '+i+' failed, reason: '+error.msg)
        console.log(error)
        await randomWaitingPeriod(waitingTimeBetweenAttempts)
      } else throw error

    }

  }

  throw new IPFSError('IPFS could not download HASH: '+hash+' to PATH: '+path+' after # '+maxAttempts+' attempts')

}


function handleDownload(hash, path, log) {
  return new Promise(function(resolve, reject) {
    // This function has to download the file but also verify that:
    // - The downloaded file is correct (checking the hash)
    // - The download is happening (with a timer)

    let readStream = ipfs.files.catReadableStream(hash)
    let writeStream = fs.createWriteStream(path)

    // Timeout cancel mechanism
    let timeoutToCancel = setTimeout(function(){
      reject(new IPFSError('Timeout to cancel expired'))
    }, timeoutTime)

    // Track progress
    let progressTracker = new ProgressTracker('MB', path, log)

    readStream
      .on('data', function(chunk) {
        clearTimeout(timeoutToCancel)
        progressTracker.track(chunk)
      })
      .on('error', handleError)

    writeStream
      .on('error', handleError)
      .on('finish', checkFile(hash, resolve, reject))

    readStream.pipe(writeStream)

  })
}

// Helper functions

function checkFile(hash, onSuccess, onError) {

  return async function() {

    if (await isfileHashValid(hash, this.path)) {
      onSuccess()
    } else {
      onError(new IPFSError('Downloaded file hash does not match origin, for: '+this.path))
    }

  }

}

function isfileHashValid(providedHash, path) {

  return new Promise(function(resolve, reject) {

    let cont = fs.readFileSync(path)
    let buffer = new Buffer(cont)

    ipfs.files.add(buffer, function (err, res) {

      if (err) reject(new IPFSError(err))

      let computedHash = res[0].hash
      if (computedHash == providedHash) {
        resolve(true)
      } else {
        resolve(false)
      }

    })

  })

}

function ProgressTracker(displayOption, fileID, log) {

  let displaySize;
  switch(displayOption) {
    case 'MB':
      displaySize = 1000000 // MB
      break;
  }

  this.downloadedSize = 0
  this.downloadedSizeDisplay = 0

  this.track = function(chunk) {

    this.downloadedSize += chunk.length

    if (Math.floor(this.downloadedSize/displaySize) > this.downloadedSizeDisplay) {
      this.downloadedSizeDisplay = Math.floor(this.downloadedSize/displaySize)
      log('Downloaded '+this.downloadedSizeDisplay+' '+displayOption)
    }

  }

}

// Utilitites

function randomWaitingPeriod(maxPeriod) {
  return new Promise(function(resolve, reject) {
    setTimeout(function(){
      resolve()
    }, maxPeriod * Math.random())
  })
}

function handleError(error) {
  throw new Error(error)
}

// Module exports

module.exports = {
  isfileHashValid : isfileHashValid,
  download : download,
  cat: cat
}

// function getAPSManifest(hash) {
//     return new Promise(function(resolve, reject) {
//         console.log("Reading manifest... " + hash);
//         ipfs.files.cat(hash, function(err, file) {
//             if (err) {
//                 return reject(err);
//             }
//             clearTimeout(timeoutReject);
//             ipfs.pin.add(hash);
//             return resolve(JSON.parse(file));
//         });
//         var timeoutReject = setTimeout(function() { return reject(new Error("ipfs cat timeout")) }, 15000);
//     });
// }

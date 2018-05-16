// node modules
const fs = require('fs')
const through = require('through2')
const createError = require('create-error')

// dedicated modules
const params = require('../params')
const ipfs = require('./ipfsSetup')

// Define custom errors

const IPFSError = createError('IPFSError')
const CACHE_DIR = params.CACHE_DIR

// Define parameters

const maxAttempts = 3
const timeoutTime = 3000
const waitingTimeBetweenAttempts = 1000
const emptyFunction = () => {}

// Main functions

async function cat(HASH) {

  let FILE_PATH = CACHE_DIR + HASH

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR)
  }

  if (fs.existsSync(FILE_PATH)) {
    // fs.fstatSync(fd)
    // stats.ctimeMs: 1318289051000.1 -> The timestamp indicating the last time the file status was changed expressed in milliseconds since the POSIX Epoch.
    // stats.ctime -> The timestamp indicating the last time the file status was changed.
    return fs.readFileSync(FILE_PATH, 'utf8')
  } else {
    await download(FILE_PATH, HASH)
    return fs.readFileSync(FILE_PATH, 'utf8')
  }

}


async function download(PATH, HASH, log=emptyFunction) {

  // Make sure hash if valid
  if(!HASH.startsWith('Qm')) {
    throw Error('Invalid IPFS hash: ' + HASH)
  }

  for (let i = 0; i < maxAttempts; i++) {

    try {
      await handleDownload(PATH, HASH, log)

    } catch(error) {
      if (error instanceof IPFSError) {
        console.trace('#### Download attempt n# '+i+' failed, reason: '+error.msg)
        console.error(error)
        await randomWaitingPeriod(waitingTimeBetweenAttempts)
      } else throw error

    }

  }

  throw new IPFSError('IPFS could not download HASH: '+HASH+' to PATH: '+PATH+' after # '+maxAttempts+' attempts')

}


function handleDownload(PATH, HASH, log) {
  return new Promise(function(resolve, reject) {
    // This function has to download the file but also verify that:
    // - The downloaded file is correct (checking the hash)
    // - The download is happening (with a timer)

    let readStream = ipfs.files.catReadableStream(HASH)
    let writeStream = fs.createWriteStream(PATH)

    // Timeout cancel mechanism
    let timeoutToCancel = setTimeout(() => {
      reject(new IPFSError('Timeout to cancel expired'))
    }, timeoutTime)

    // Track progress
    let progressTracker = new ProgressTracker('KB', PATH, log)

    readStream
      .on('data', function(chunk) {
        clearTimeout(timeoutToCancel)
        progressTracker.track(chunk)
      })
      .on('error', handleError)

    writeStream
      .on('error', handleError)
      .on('finish', checkFile(HASH, resolve, reject))

    readStream.pipe(writeStream)

  })
}

// Helper functions

function checkFile(HASH, onSuccess, onError) {

  return async function() {

    if (await isfileHashValid(HASH, this.path)) {
      onSuccess()
    } else {
      onError(new IPFSError('Downloaded file hash does not match origin, for: '+this.path))
    }

  }

}

function isfileHashValid(providedHash, PATH) {

  return new Promise(function(resolve, reject) {

    let cont = fs.readFileSync(PATH)
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
    case 'KB':
      displaySize = 1000 // MB
      break;
  }

  this.downloadedSize = 0
  this.downloadedSizeDisplay = 0

  this.track = function(chunk) {

    this.downloadedSize += chunk.length

    if (Math.floor(this.downloadedSize/displaySize) > this.downloadedSizeDisplay) {
      this.downloadedSizeDisplay = Math.floor(this.downloadedSize/displaySize)
      // Log the downloaded amount
      log(this.downloadedSizeDisplay)
    }

  }

}

// Utilitites

function randomWaitingPeriod(maxPeriod) {
  return new Promise(function(resolve, reject) {
    setTimeout(() => {
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

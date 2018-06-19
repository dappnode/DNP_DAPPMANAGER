// node modules
const fs = require('fs')
const through = require('through2')
const createError = require('create-error')
const isIPFS = require('is-ipfs')

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
const emptyFoo = x => x

// Main functions

async function cat(HASH) {

  let FILE_PATH = CACHE_DIR + HASH

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR)
  }

  if (!fs.existsSync(CACHE_DIR+'/ipfs')) {
    fs.mkdirSync(CACHE_DIR+'/ipfs')
  }

  if (fs.existsSync(FILE_PATH) && fs.statSync(FILE_PATH).size > 0 && isfileHashValid(HASH, FILE_PATH) ) {
    // fs.fstatSync(fd)
    // stats.ctimeMs: 1318289051000.1 -> The timestamp indicating the last time the file status was changed expressed in milliseconds since the POSIX Epoch.
    // stats.ctime -> The timestamp indicating the last time the file status was changed.
    return fs.readFileSync(FILE_PATH, 'utf8')
  } else {
    await download(FILE_PATH, HASH)
    return fs.readFileSync(FILE_PATH, 'utf8')
  }

}


async function download(PATH, HASH, log=emptyFoo, round=emptyFoo) {

  // Correct hash prefix
  if (HASH.includes('ipfs/')) {
    HASH = HASH.split('ipfs/')[1]
  }

  // Make sure hash if valid
  if(!isIPFS.multihash(HASH)) {
    throw Error('Invalid IPFS hash: ' + HASH)
  }

  for (let i = 0; i < maxAttempts; i++) {

    try {
      await handleDownload(PATH, HASH, log, round)
      return

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


function handleDownload(PATH, HASH, log, round) {
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
    let progressTracker = new ProgressTracker(log, round)

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

    ipfs.files.add([PATH], {onlyHash: true}, function (err, res) {

      if (err) reject(new IPFSError(err))

      let computedHashClean = res[0].hash.replace('ipfs/','').replace('/','')
      let providedHashClean = providedHash.replace('ipfs/','').replace('/','')

      if (computedHashClean == providedHashClean) {
        resolve(true)
      } else {
        resolve(false)
      }

    })
  })
}

function ProgressTracker(log, round) {

  this.prev = this.bytes = 0
  this.round = round

  this.track = (chunk) => {
    if (this.round(this.bytes += chunk.length) > this.prev)
      log(this.prev = this.round(this.bytes))
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

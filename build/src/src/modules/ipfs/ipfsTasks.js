const fs = require('fs');
const {promisify} = require('util');
const validate = require('utils/validate');

/**
 * IPFS methods.
 *
 */

// Depedencies
const ipfs = require('./ipfsSetup');
const logs = require('logs.js')(module);
const {parseResHash, validateIpfsHash} = require('./utils');

// Declare parameters for all methods to have access to
const timeoutTime = 3000;

// Declare methods
const pinHash = (HASH) => {
    ipfs.pin.add(HASH, (err) => {
        if (err) logs.error('Error pinging hash '+HASH+': '+err.message);
    });
};

const isfileHashValid = async (providedHash, PATH) => {
    // First, ensure that the PATH file is correct
    if (!fs.existsSync(PATH) || fs.statSync(PATH).size == 0) return false;

    /*
    * > TODO: Verify that the file is not too old
    * fs.fstatSync(fd)
    * stats.ctimeMs: 1318289051000.1 -> The timestamp indicating the last time the file status
    * was changed expressed in milliseconds since the POSIX Epoch.
    * stats.ctime -> The timestamp indicating the last time the file status was changed.
    */

    // Then, verify that the hashes are correct
    const res = await promisify(ipfs.files.add)([PATH], {onlyHash: true});
    const computedHash = parseResHash(res);
    const computedHashClean = computedHash.replace('ipfs/', '').replace('/', '');
    const providedHashClean = providedHash.replace('ipfs/', '').replace('/', '');
    const fileHashValid = (computedHashClean == providedHashClean);
    // Return the boolean
    return fileHashValid;
};

const downloadHandler = (HASH, PATH, logChunks) =>
    new Promise(function(resolve, reject) {
    // This function has to download the file but also verify that:
    // - The downloaded file is correct (checking the hash)
    // - The download is happening (with a timer)

    // Timeout cancel mechanism
    const timeoutToCancel = setTimeout(() => {
        reject(new Error('Timeout to cancel expired'));
    }, timeoutTime);

    // Construct handlers
    const handleError = (origin) => (err) => {
        clearTimeout(timeoutToCancel);
        reject(Error(origin+': '+err));
    };
    const trackProgress = (chunk) => {
        clearTimeout(timeoutToCancel);
        if (logChunks) logChunks(chunk);
    };
    const checkFileHash = async () => {
        if (!fs.existsSync(PATH) || fs.statSync(PATH).size == 0) {
            reject('Downloaded file: '+PATH+', is empty or not existent');
        }
        else if (await isfileHashValid(HASH, PATH)) {
            resolve();
        } else {
            reject('Downloaded file: '+PATH+', is corrupt');
            // if the file's hash is not valid remove it.
            await fs.unlinkSync(PATH);
        }
    };
    const readStream = ipfs.files.catReadableStream(HASH)
    .on('data', trackProgress)
    .on('error', handleError('ReadableStream'));
    const writeStream = fs.createWriteStream(PATH)
    .on('finish', checkFileHash)
    .on('error', handleError('WriteStream'));
    readStream.pipe(writeStream);
});

const download = async (HASH, PATH, logChunks) => {
    // console.trace('ABOUT TO DOWNLOAD', ' $$ ', HASH, ' $$ ', PATH, ' $$ ', logChunks);
    // If the file is already downloaded and valid, skip
    if (await isfileHashValid(HASH, PATH)) return;
    // Validate arguments
    validate.path(PATH);
    HASH = validateIpfsHash(HASH);
    // execute download
    await downloadHandler(HASH, PATH, logChunks);
    // If download was successful, pin file. Pin paralelly, and don't propagate errors
    pinHash(HASH);
};

const cat = async (HASH, options = {}) => {
    const file = await promisify(ipfs.files.cat)(HASH);
    // If cat was successful, pin file. Pin paralelly, and don't propagate errors
    pinHash(HASH);
    // Return buffer or string
    return options.buffer ? file : file.toString('utf8');
};

module.exports = {
    download,
    cat,
    // Auxiliar methods
    isfileHashValid,
    downloadHandler,
};

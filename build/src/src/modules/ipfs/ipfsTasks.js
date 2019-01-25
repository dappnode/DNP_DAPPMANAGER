const fs = require('fs');
const {promisify} = require('util');
const validate = require('utils/validate');
const verifyXz = require('utils/verifyXz');

/**
 * IPFS methods.
 *
 */

// Depedencies
const ipfs = require('./ipfsSetup');
const params = require('params');
const logs = require('logs.js')(module);
// const {parseResHash, validateIpfsHash} = require('./utils');
const {validateIpfsHash} = require('./utils');

// Declare parameters for all methods to have access to
const CACHE_DIR = params.CACHE_DIR;

// Declare methods
const isfileHashValid = async (providedHash, PATH) => {
    // First, ensure that the PATH file is correct
    if (!fs.existsSync(PATH)) {
        // When a file is downloaded for the first time this check will be true. Don't log a warning
        return false;
    }
    if (fs.statSync(PATH).size == 0) {
        logs.warn(`IPFS downloaded file ${PATH} is invalid: it's size is 0 bytes`);
        return false;
    }

    // If the file is a .xz, verify it. If the test succeeds, continue execution
    if (PATH && PATH.endsWith('.xz')) {
        const result = await verifyXz(PATH);
        if (result.success) {
            // Successful .xz verification
        } else {
            // Failed .xz verification
            logs.warn(`IPFS downloaded file ${PATH} is invalid: Failed .xz verification: ${result.message}`);
            return false;
        }
    }

    /*
    * > TODO: Verify that the file is not too old
    * fs.fstatSync(fd)
    * stats.ctimeMs: 1318289051000.1 -> The timestamp indicating the last time the file status
    * was changed expressed in milliseconds since the POSIX Epoch.
    * stats.ctime -> The timestamp indicating the last time the file status was changed.
    */

    // Then, verify that the hashes are correct

    // ########################################
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // ########################################
    //
    // Alarming behaviour has been observed where
    // IPFS returned different hashes for equal files.
    // While this issue is resolved,
    // the hash verification will be deactivated.
    //
    // ########################################
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // ########################################

    return true;

    // const res = await promisify(ipfs.files.add)([PATH], {onlyHash: true});
    // const computedHash = parseResHash(res);
    // const computedHashClean = computedHash.replace('ipfs/', '').replace('/', '');
    // const providedHashClean = providedHash.replace('ipfs/', '').replace('/', '');
    // const fileHashValid = (computedHashClean == providedHashClean);
    // // Return the boolean
    // return fileHashValid;
};

const downloadHandler = (HASH, PATH, logChunks, options = {}) => new Promise((resolve, reject) => {
    // This function has to download the file but also verify that:
    // - The downloaded file is correct (checking the hash)
    // - The download is happening (with a timer)

    // Timeout cancel mechanism
    const timeoutToCancel = setTimeout(() => {
        reject(Error('Timeout to cancel expired'));
    }, params.IPFS_TIMEOUT);

    // Construct handlers
    const handleError = (origin) => (err) => {
        clearTimeout(timeoutToCancel);
        reject(Error(origin+': '+err));
    };
    let downloadedSize = 0;
    const trackProgress = (chunk) => {
        clearTimeout(timeoutToCancel);
        if (logChunks) logChunks(chunk);
        downloadedSize += chunk.length;
        if (options.maxSize && downloadedSize > options.maxSize) {
            reject(Error(`Downloaded size exceeds maximum allowed ${options.maxSize} bytes`));
        }
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

const download = async (HASH, PATH, logChunks, options) => {
    // console.trace('ABOUT TO DOWNLOAD', ' $$ ', HASH, ' $$ ', PATH, ' $$ ', logChunks);
    // If the file is already downloaded and valid, skip
    if (await isfileHashValid(HASH, PATH)) return;
    // Validate arguments
    validate.path(PATH);
    HASH = validateIpfsHash(HASH);
    // execute download
    await downloadHandler(HASH, PATH, logChunks, options);
    // If download was successful, pin file. Pin paralelly, and don't propagate errors
    ipfs.pin.add(HASH, (err) => {
        if (err) logs.error('Error pinning hash '+HASH+': '+err.message);
    });
};


const cat = async (HASH, options = {}) => {
    const PATH = CACHE_DIR + HASH;
    await download(HASH, PATH, null, options);
    if (options.buffer) {
        return await promisify(fs.readFile)(PATH);
    } else {
        return await promisify(fs.readFile)(PATH, 'utf8');
    }
};

module.exports = {
    download,
    cat,
    // Auxiliar methods
    isfileHashValid,
    downloadHandler,
};

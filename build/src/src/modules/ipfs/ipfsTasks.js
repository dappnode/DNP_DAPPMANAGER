// node modules
const fs = require('fs');
const {promisify} = require('util');
// dedicated modules
const validate = require('utils/validate');

// Depedencies
const ipfs = require('./ipfsSetup');
const params = require('params');
const {parseResHash, validateIpfsHash} = require('./utils');

// Declare parameters for all methods to have access to
const CACHE_DIR = params.CACHE_DIR;
const timeoutTime = 3000;

// Declare methods
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
    // if the file's hash is not valid remove it.
    if (!fileHashValid) await fs.unlinkSync(PATH);
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
        if (await isfileHashValid(HASH, PATH)) resolve();
        else reject(Error('Downloaded file: '+PATH+', is corrupt'));
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
    return await downloadHandler(HASH, PATH, logChunks);
};

const cat = async (HASH) => {
    const PATH = CACHE_DIR + HASH;
    await download(HASH, PATH);
    return fs.readFileSync(PATH, 'utf8');
};

module.exports = {
    download,
    cat,
    // Auxiliar methods
    isfileHashValid,
    downloadHandler,
};

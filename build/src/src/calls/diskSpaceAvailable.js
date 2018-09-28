const shellExec = require('utils/shell');
const fs = require('fs');

/**
 * Returns the list of current containers associated to packages
 *
 * @param {Object} kwargs: {path}
 * @return {Object} A formated success message.
 * result: packages =
 *   [
 *     {
 *       id: '9238523572017423619487623894', (string)
 *       isDNP: true, (boolean)
 *       created: <Date string>,
 *       image: <Image Name>, (string)
 *       name: otpweb.dnp.dappnode.eth, (string)
 *       shortName: otpweb, (string)
 *       version: '0.0.4', (string)
 *       ports: <list of ports>, (string)
 *       state: 'exited', (string)
 *       running: true, (boolean)
 *       ...
 *       envs: <Env variables> (object)
 *     },
 *     ...
 *   ]
 */
const diskSpaceAvailable = async ({path}) => {
    if (!fs.existsSync(path)) {
        return {
            exists: false,
            totalSize: 0,
            availableSize: 0,
        };
    }
    const res = await shellExec(`df -h ${path} | awk 'NR>1 { print $2,$4}'`, true);
    const [totalSize, availableSize] = res.split(/\s+/);
    //  df . -h --output='avail'
    //  Used Avail
    //  192G  9.9G

    return {
        message: `Checked space of ${path}`,
        result: {
            exists: true,
            totalSize,
            availableSize,
        },
    };
};


module.exports = diskSpaceAvailable;

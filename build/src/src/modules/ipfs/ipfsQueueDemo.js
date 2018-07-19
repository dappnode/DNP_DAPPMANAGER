'use strict';

const ipfsQueueFactory = require('./ipfsQueue');

const syncTimer = () => new Promise((resolve) => {
    setTimeout(resolve, 1000);
});

const ipfs = {
    download: async ({HASH}) => {
        console.log('Downloading HASH: '+HASH);
        await syncTimer();
        if (Math.floor(2*Math.random())) {
            return 'Download OK';
        } else {
            throw Error('Download ERROR');
        }
    },
};

const ipfsQueue = ipfsQueueFactory(ipfs);

// add some items to the queue
const downloadWrap = (args) => {
    ipfsQueue.download(args)
    .then((res) => {console.log(args.HASH+' RES: '+res);})
    .catch((err) => {console.log(args.HASH+' ERROR: '+err);});
};
downloadWrap({HASH: 'Hash A'});
downloadWrap({HASH: 'Hash B'});
downloadWrap({HASH: 'Hash C'});

setTimeout(()=>{
    downloadWrap({HASH: 'Hash D'});
    downloadWrap({HASH: 'Hash E'});
    downloadWrap({HASH: 'Hash F'});
}, 10000);

// this.scheduledTask.addTask({
//     name: this.name(),
//     func: this.func(data),
//     responsehandler: this.responseHandler(data, callback),
//     data: {
//         socket: socket,
//     },
// });


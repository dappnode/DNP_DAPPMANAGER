'use strict';
const winston = require('winston');

/*
* > LEVELS:
* ---------------------
* logs.info('Something')
* logs.warn('Something')
* logs.error('Something')
*/

const scFormat = winston.format.printf((info) => {
    let level = info.level.toUpperCase();
    let message = info.message;
    let filteredInfo = Object.assign({}, info, {
        'level': undefined,
        'message': undefined,
        'splat': undefined,
        'label': undefined,
        'timestamp': undefined,
    });
    let append = JSON.stringify(filteredInfo, null, 4);
    if (append != '{}') {
        message = message + ' ' + append;
    }
    // return `${info.timestamp} ${level} [${info.label}] : ${message}`;
    return `${level} [${info.label}] : ${message}`;
});

/**
 * Get a label to desribe the module we're logging for.
 *
 * @param {Object}  mod The module we're logging for or a description of the
 *                      logger.
 * @return {winston.format.label}
 */
function _getLabel(mod) {
    let label = mod;
    if (mod == undefined) {
        mod = module;
    }
    if (mod.id) {
        label = mod.id.replace('.js', '');
        label = label.replace(/^.*\/src\//, '');
    }
    return winston.format.label({'label': label});
}

module.exports = function(mod) {
	const logger = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
		format: winston.format.combine(
			winston.format.splat(),
			winston.format.timestamp(),
            _getLabel(mod),
            scFormat
		),
		transports: [new winston.transports.Console()],
	});
    return logger;
};

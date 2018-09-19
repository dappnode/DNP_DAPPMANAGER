'use strict';
const winston = require('winston');
const {createLogger, format, transports} = winston;

/*
* Generic logger to the console and therefore the container logs
*/

/*
* > LEVELS:
* ---------------------
* logs.info('Something')
* logs.warn('Something')
* logs.error('Something')
*/

const scFormat = format.printf((info) => {
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
    const variables = [];
    if (info.admin) variables.push('ADMIN');

    // return `${info.timestamp} ${level} [${info.label}] : ${message}`;
    return `${level} [${info.label}] [${variables.join('&')}] : ${message}`;
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
    return format.label({'label': label});
}

module.exports = function(mod) {
	const logger = createLogger({
        level: process.env.LOG_LEVEL || 'info',
		format: format.combine(
            format.splat(),
			format.timestamp({
                format: 'DD-MM-YYYY HH:mm:ss',
            }),
            _getLabel(mod),
            scFormat
		),
		transports: [
            new transports.Console({
                // format: format.combine(
                //   format.timestamp(),
                //   format.colorize(),
                //   format.simple()
                // ),
            }),
        ],
	});
    return logger;
};

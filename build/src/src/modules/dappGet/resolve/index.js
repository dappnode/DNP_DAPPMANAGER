const findCompatibleState = require('./findCompatibleState');

function resolver(dnps) {
    try {
        const result = findCompatibleState(dnps);
        return result;
    } catch (e) {
        return {
            success: false,
            message: e.message,
        };
    }
}

module.exports = resolver;

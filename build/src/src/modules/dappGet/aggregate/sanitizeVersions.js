// WARNING: versions is an external uncontrolled input, verify

function sanitizeVersions(versions) {
    if (!versions) {
        throw Error('SANITIZE-ERROR: Versions is not defined');
    }
    if (!Array.isArray(versions)) {
        throw Error(`SANITIZE-ERROR: Versions is not an array. versions: ${JSON.stringify(versions)}`);
    }
    return versions;
}

module.exports = sanitizeVersions;

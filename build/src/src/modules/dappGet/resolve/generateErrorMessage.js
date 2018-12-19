// Format an error message
function generateErrorMessage({hasTimedOut, timeoutMs, caseId, totalCases, errors}) {
    const errorMsgs = [`Could not find a compatible state.`];
    // Timeout message
    if (hasTimedOut) errorMsgs.push(`Resolver timed out (${timeoutMs} ms).`);
    // Blame message
    try {
        const blameDep = {};
        const blameDepReq = {};
        for (const key of Object.keys(errors)) {
            const [_req, _dep] = key.split('#');
            const req = _req.split('@')[0];
            const dep = _dep.split('@')[0];
            blameDep[dep] = (blameDep[dep] || 0) + errors[key];
            if (!blameDepReq[dep]) blameDepReq[dep] = {};
            blameDepReq[dep][req] = true;
        }
        const highestDep = Object.keys(blameDep)
            .reduce((a, b) => blameDep[a] > blameDep[b] ? a : b);
        const blamePackages = Object.keys(blameDepReq[highestDep]).join(', ');
        errorMsgs.push(
            `Packages ${blamePackages} request incompatible versions of ${highestDep}.`
        );
    } catch (e) {
        // Ignore possible errors from the message processing
    }
    // Report how many cases have been checked
    errorMsgs.push(`Checked ${caseId}/${totalCases} possible states.`);
    // Construct the message
    return errorMsgs.join(' ');
}

module.exports = generateErrorMessage;


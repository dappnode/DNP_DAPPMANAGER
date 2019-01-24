const expect = require('chai').expect;

const verifyXz = require('utils/verifyXz');
const shell = require('utils/shell');

const testDirectory = './test_files/';
const okFilePath = `${testDirectory}ok-file.txt.xz`;
const okFilePreCompress = okFilePath.replace('.xz', '');
const corruptFilePath = `${testDirectory}corrupt-file.txt.xz`;
const missingFilePath = `${testDirectory}missing-file.txt.xz`;

async function cleanFiles() {
    for (const path of [okFilePath, okFilePreCompress, corruptFilePath]) {
        await shell(`rm -f ${path}`);
    }
}

describe('Util: verifyXz', function() {
    before(async () => {
        await cleanFiles();
        await shell(`echo "some content" > ${okFilePreCompress}`);
        await shell(`xz ${okFilePreCompress}`);
        await shell(`echo "bad content" > ${corruptFilePath.replace('.xz', '')}`);
    });

    it('okFilePath should be OK', async () => {
        const isOk = await verifyXz(okFilePath);
        expect(isOk).equal(true);
    });

    it('corruptFilePath should NOT be ok', async () => {
        const isOk = await verifyXz(corruptFilePath);
        expect(isOk).equal(false);
    });

    it('missingFilePath should NOT be ok', async () => {
        const isOk = await verifyXz(missingFilePath);
        expect(isOk).equal(false);
    });

    after(async () => {
        await cleanFiles();
    });
});



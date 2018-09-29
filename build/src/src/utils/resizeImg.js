const fs = require('fs');
const {promisify} = require('util');
const {spawn} = require('child_process');

function executeResizeImage(inputPath, outputPath, pixelWidth) {
    return new Promise((resolve, reject) => {
        const ls = spawn('convert', [
            inputPath,
            '-resize',
            `${pixelWidth}x${pixelWidth}^`,
            '-gravity',
            'center',
            '-extent',
            `${pixelWidth}x${pixelWidth}`,
            outputPath,
        ]);
        let stdout = '';
        ls.stdout.on('data', (data) => stdout += data);
        let stderr = '';
        ls.stderr.on('data', (data) => stderr += data);
        ls.on('close', (code) => {
            if (code !== 0) reject(Error(stderr));
            else resolve(outputPath);
        });
    });
}

async function resizeImg(inputBuffer, pixelWidth) {
        const tagPath = 'temp-resize-image-'+Date.now()+Math.random();
        const inputPath = tagPath+'-input.png';
        const outputPath = tagPath+'-output.png';
        await promisify(fs.writeFile)(inputPath, inputBuffer);
        await executeResizeImage(inputPath, outputPath, pixelWidth);
        const outputBuffer = await promisify(fs.readFile)(outputPath);
        await promisify(fs.unlink)(inputPath);
        await promisify(fs.unlink)(outputPath);
        return outputBuffer;
}

module.exports = resizeImg;

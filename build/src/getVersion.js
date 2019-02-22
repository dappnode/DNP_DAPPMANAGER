#!/usr/bin/env node

/**
 * Using node in this script because it requires JSON parsing
 * This script will output a json file:
 * {
 *   "version": "0.1.21",
 *   "branch": "master",
 *   "commit": "ab991e1482b44065ee4d6f38741bd89aeaeb3cec"
 * }
 */

const fs = require('fs');
const exec = (cmd) =>
  require('child_process')
    .execSync(cmd)
    .toString()
    .trim();

const version = JSON.parse(fs.readFileSync('dappnode_package.json', 'utf8')).version;

const branch = exec('git rev-parse --abbrev-ref HEAD');
const commit = exec('git rev-parse --verify HEAD');

fs.writeFileSync('.version.json', JSON.stringify({version, branch, commit}, null, 2));

const expect = require('chai').expect;

const shellExecSync = require('utils/shell');

describe('Util: shell', function() {
  it('should return an error when cating a non-existing file', async () => {
    let res = await shellExecSync('cat package.json', true);
    expect(res)
      .to.include('"dependencies": {');
  });

  it('should return the content of a file when cating', async () => {
    let error = '--- shellExecSync did not throw ---';
    try {
      await shellExecSync('cat jfnakjsdfnodfu9sadf', true);
    } catch (e) {
      error = e.message;
    }
    expect(error).to.include('No such file');
  });
});

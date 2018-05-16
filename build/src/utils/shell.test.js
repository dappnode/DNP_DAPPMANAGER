const chai = require('chai')
const expect = require('chai').expect

const shellExecSync = require('./shell')


describe('Util: shell', function() {

  if (process.env.TEST_INTEGRATION == 'true') {
    integrationTest()
  }

})

function integrationTest() {

  describe('exec Sync', function() {
    const envs = {
      VAR1: 'VALUE1',
      VAR2: 'VALUE2'
    }
    const envString = 'VAR1=VALUE1\nVAR2=VALUE2'

    it('should return an error when cating a non-existing file', async () => {
      let res = await shellExecSync('cat package.json')
      expect(res)
        .to.include('\"dependencies\": {')
    })

    it('should return the content of a file when cating', async () => {
      let error = '--- shellExecSync did not throw ---'
      try {
        let res = await shellExecSync('cat jfnakjsdfnodfu9sadf')
      } catch(e) {
        error = e.message
      }
      expect(error).to.include('No such file')
    })

  })
}

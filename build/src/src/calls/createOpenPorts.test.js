const chai = require('chai');
const expect = require('chai').expect;
const createOpenPorts = require('calls/createOpenPorts');

chai.should();

describe('Call function: openPorts', function() {
      const openedPorts = [];
      const dockerMock = {
        openPort: async (port) => {
          openedPorts.push(port);
        },
      };

      const openPorts = createOpenPorts({
        docker: dockerMock,
      });

      it('should open the requested ports', async () => {
        const ports = [5000, 5001];
        const res = await openPorts({ports});
        // Check opened ports
        expect(ports).to.deep.equal(openedPorts);
        // Check response message
        expect(res).to.be.ok;
        expect(res).to.have.property('message');
      });

      it('should throw an error with wrong ports variable', async () => {
        let error = '--- openPorts did not throw ---';
        try {
          await openPorts({ports: 'not an array'});
        } catch (e) {
          error = e.message;
        }
        expect(error).to.include('ports variable must be an array');
      });
});

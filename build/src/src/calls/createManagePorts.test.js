const chai = require('chai');
const expect = require('chai').expect;
const createManagePorts = require('calls/createManagePorts');

chai.should();

describe('Call function: managePorts', function() {
      const openedPorts = [];
      const dockerMock = {
        openPort: async (port) => {
          openedPorts.push(port);
        },
      };

      const managePorts = createManagePorts({
        docker: dockerMock,
      });

      it('should open the requested ports', async () => {
        const ports = [5000, 5001];
        const res = await managePorts({ports});
        // Check opened ports
        expect(ports).to.deep.equal(openedPorts);
        // Check response message
        expect(res).to.be.ok;
        expect(res).to.have.property('message');
      });

      it('should throw an error with wrong ports variable', async () => {
        let error = '--- managePorts did not throw ---';
        try {
          await managePorts({ports: 'not an array'});
        } catch (e) {
          error = e.message;
        }
        expect(error).to.include('ports variable must be an array');
      });
});

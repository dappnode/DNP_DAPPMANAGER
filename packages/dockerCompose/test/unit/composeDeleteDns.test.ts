import "mocha";
import { expect } from "chai";
import { ComposeEditor } from "../../src/index.js";
import { Compose } from "@dappnode/types";

describe('ComposeServiceEditor', function() {
  describe('removeDns()', function() {
    it.only('should remove the dns field from the service', function() {
      // Create a mock compose object
      const mockCompose: Compose = {
        version: '3',
        services: {
          myservice: {
            image: 'myimage',
            dns: '8.8.8.8',
            environment: [],
          },
        },
      };

      // Create a ComposeEditor instance with the mock compose
      const composeEditor = new ComposeEditor(mockCompose);

      // Get the service editor for 'myservice'
      const serviceEditor = composeEditor.services()['myservice'];

      // Ensure dns field is present before removal
      expect(serviceEditor.get().dns).to.deep.equal('8.8.8.8');

      // Call removeDns()
      serviceEditor.removeDns();

      // Get the updated service
      const updatedService = serviceEditor.get();

      // Verify that the dns field is removed
      expect(updatedService.dns).to.be.undefined;

      // Output the compose and check that dns is not present
      const outputCompose = composeEditor.output();
      expect(outputCompose.services['myservice'].dns).to.be.undefined;

      // Ensure other fields remain unchanged
      expect(outputCompose.services['myservice'].image).to.equal('myimage');
    });
  });
});

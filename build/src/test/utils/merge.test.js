const expect = require('chai').expect;

const merge = require('utils/merge');

describe('Util: merge', function() {
  const manifest = {
    'name': 'kovan.dnp.dappnode.eth',
    'image': {
      'ports': [
        '30303',
        '30303/udp',
        '30304:30304',
      ],
      'volumes': [
        'kovan:/root/.local/share/io.parity.ethereum/',
      ],
    },
  };

  it('should merge the vols object', () => {
      const vols = {
        [manifest.name]: {
            'kovan:/root/.local/share/io.parity.ethereum/': 'different_path:/root/.local/share/io.parity.ethereum/',
        },
      };
      const editedManifest = merge.manifest.vols(manifest, vols);
      expect(editedManifest).to.deep.equal({
        'name': 'kovan.dnp.dappnode.eth',
        'image': {
          'ports': [
            '30303',
            '30303/udp',
            '30304:30304',
          ],
          'volumes': [
            'different_path:/root/.local/share/io.parity.ethereum/',
          ],
        },
      });
  });

  it('should merge the ports object', () => {
    const ports = {
      [manifest.name]: {
          '30303': '31313:30303',
          '30303/udp': '31313:30303/udp',
          '30304:30304': '30304',
      },
    };
    const editedManifest = merge.manifest.ports(manifest, ports);
    expect(editedManifest).to.deep.equal({
      'name': 'kovan.dnp.dappnode.eth',
      'image': {
        'ports': [
          '31313:30303',
          '31313:30303/udp',
          '30304',
        ],
        'volumes': [
          'kovan:/root/.local/share/io.parity.ethereum/',
        ],
      },
    });
  });
});

module.exports = {
  name: 'dependency loop',
  req: {
    name: 'dnp-a.eth',
    ver: '0.1.0',
  },
  expectedSuccess: {
    'dnp-a.eth': '0.1.0',
    'dnp-b.eth': '0.1.0',
    'dnp-c.eth': '0.1.0',
  },
  dnps: {
    'dnp-a.eth': {
      versions: {
        '0.1.0': {
          dependencies: {'dnp-b.eth': '0.1.0'},
        },
      },
    },
    'dnp-b.eth': {
      versions: {
        '0.1.0': {
          dependencies: {'dnp-c.eth': '0.1.0'},
        },
      },
    },
    'dnp-c.eth': {
      versions: {
        '0.1.0': {
          dependencies: {'dnp-a.eth': '0.1.0'},
        },
      },
    },
  },
};

# DAppNode Release downloading

Two new features:

- Ensure content integrity from developer's signature
- Consume content from an IPFS gateway trustlessly

Consuming a release has two steps:

1. Get a release hash from the user or resolved from the blockchain

```
QmA1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1
```

2. Query an IPFS node to list the files in the release hash. Verify that directory contents hash to `QmA1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1A1` (**TODO**: todo how to do it?).

```
dappnode_package.json: QmB2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2
signature.json: QmC3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3
```

3. Query an IPFS node to get the signature file `QmC3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3C3`. Verify the downloaded content matches the file CID with `dag/export`.
4. Verify that the content in the directory except `signature.json` is signed by a well-known key.
5. Query an IPFS node to get the metadata files of the directory `QmB2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2B2`. Verify the downloaded content matches the file CID with `dag/export`.
6. If the release hash was resolved from the blockchain check that the manifest.name and manifest.version match the values from the blockchain query.
7. Preview the release to the user in the UI, show metadata + avatar
8. If user accepts the installation download the directory to local FS. Use `dag/export` API to verify the entire directory against the release hash. Verify that the directory content files match the ones listed in `signature.json`.
9. Install package

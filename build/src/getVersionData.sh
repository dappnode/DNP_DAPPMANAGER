#!/bin/bash

# The purpose of this script is to export version variables
# The nodejs app should import the TARGET_FILE at runtime

export TARGET_FILE=.version.json
export VERSION=$(cat dappnode_package.json | jq -r '.version')
export BRANCH=$(git rev-parse --abbrev-ref HEAD)
export COMMIT=$(git rev-parse --verify HEAD)

jq -n --arg b "$BRANCH" --arg c "$COMMIT" --arg v "$VERSION" '{branch: $b, commit: $c, version: $v}' > $TARGET_FILE
# Make sure the file is created correctly
cat $TARGET_FILE

# Clean useless files
rm dappnode_package.json && rm -r .git

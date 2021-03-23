#!/bin/bash
set -e #very important in ci, install cna fail for example and we would want to stop all further code

# Reliably get the directory containing this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd ${DIR}/..
npm install
#compile, test, ship
npm run compile #we might be able to get rid of this if serveless deploy also compiles
npm run deploy -- --stage prod #credentials needed, add stage arguments

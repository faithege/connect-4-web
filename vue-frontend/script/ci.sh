#!/bin/bash
set -e # very important in ci, install can fail for example and we would want to stop all further code

# Reliably get the directory containing this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd ${DIR}/..

# clean up existing dist file first > if don't will become additive (not best practice)
rm -r ${DIR}/../dist

npm install

#compile, test
npm run build-prod # if unsuccessful will blow up

# for SPA we need to copy the index.html file and rename as 404.html
cp ${DIR}/../dist/index.html ${DIR}/../dist/404.html # be explicit

echo "c4.faithege.dev" > ${DIR}/../dist/CNAME



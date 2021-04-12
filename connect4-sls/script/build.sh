#!/bin/bash
set -e # very important in ci, install can fail for example and we would want to stop all further code

# Reliably get the directory containing this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

PACKAGE="${DIR}/../package"

# clean up existing dist file first > if don't will become additive (not best practice)
rm -r ${PACKAGE} || true

cd ${DIR}/..
npm install #installs serverless but not globally so serverless only available in context of npm 

#build - use npm run as serverless is not installed globally so serverless package
npm run build-prod -- --package ${PACKAGE}

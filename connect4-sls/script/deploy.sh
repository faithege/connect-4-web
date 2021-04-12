#!/bin/bash
set -e # very important in ci, install can fail for example and we would want to stop all further code

# Reliably get the directory containing this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

PACKAGE="${DIR}/../package"

cd ${DIR}/..

# npm run serverless using -- means we can add onto it,  e.g. and specify credentials
npm run serverless -- config credentials \
 --provider aws \
 --key ${AWS_ACCESS_KEY_ID} \
 --secret ${AWS_SECRET_ACCESS_KEY} \
 --profile cbf
#compile, test, ship
#npm run compile # not necessary as  serveless deploy also compiles
npm run deploy-prod -- --package ${PACKAGE}#credentials needed, add stage arguments using -- as we want to add onto the end of a command we have in our package.json

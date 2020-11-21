#!/bin/bash
set -e # Good practice - ensures that if any errors received, script does not continue to run
export AWS_DEFAULT_PROFILE=cbf # Making sure I'm always using the right aws profile
export AWS_PROFILE=cbf # Another name that my aws cli seems to use

# Reliably get the directory containing this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

STACK="connect4"
TEMPLATE="${DIR}/../cloud-formation/template.cfn.yaml"
# PAYLOAD=$3 #the JSON object needs to be passed in with ''

WORKDIR="../working"
mkdir -p ${WORKDIR}

if [ -z "${STACK}" -o ! -r "${TEMPLATE}" ] 
then
    echo "Usage: $0 <stack> <template-file> "
    exit 1
fi

WORKING_TEMPLATE="${WORKDIR}/output-template.cfn.yaml"
BUCKET=cbf-faith-bucket

# Build the app
(
  cd ${DIR}/../lambda-js
  # Use nvm to switch to the project's node version
  [ -s "${NVM_DIR}/nvm.sh" ] && source "${NVM_DIR}/nvm.sh"
  [ -s "$(brew --prefix nvm)/nvm.sh" ] && source "$(brew --prefix nvm)/nvm.sh"
  nvm use
  npm install
  # compile
  npm run transpile
)

aws cloudformation package --template-file ${TEMPLATE} --s3-bucket ${BUCKET} --output-template-file ${WORKING_TEMPLATE}
# No need to use && as in a script we have set -e 
aws cloudformation deploy --template-file ${WORKING_TEMPLATE} --stack-name ${STACK} --capabilities CAPABILITY_IAM 
# Here we are extracting the 'Function' resource from the stack so we don't need to hardcode it -> DYNAMIC ->use $(<command>) or will be read as a string!
# Destcribe-stack-resource returns a JSON which we interrogrape with jq to get the id we need
# FUNCTION=$(aws cloudformation describe-stack-resource --stack-name ${STACK} --logical-resource-id Function | jq -r .StackResourceDetail.PhysicalResourceId)
# aws lambda invoke --cli-binary-format raw-in-base64-out --log-type Tail --payload ${PAYLOAD} --function-name ${FUNCTION} output | jq -r .LogResult | base64 --decode

# example of how to call> bash -x deploy-and-invoke.sh cbf template.cfn.yaml '{"id":"thomas"}'
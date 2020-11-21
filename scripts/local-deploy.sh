#!/bin/bash
set -e 

# Reliably get the directory containing this script
export DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

STACK="connect4local"
WORKING_TEMPLATE="${DIR}/../cloud-formation/local.cfn.yaml"

aws cloudformation deploy \
    --template-file ${WORKING_TEMPLATE} \
    --stack-name ${STACK} \
    --capabilities CAPABILITY_IAM \
    --endpoint-url http://localhost:4566 
import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from 'aws-lambda/trigger/api-gateway-proxy';
import AWS from 'aws-sdk';
import { promises } from 'fs';

export const handler = async function(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2> {
    return Promise.reject()
}
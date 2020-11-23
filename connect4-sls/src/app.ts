import { APIGatewayProxyHandler } from "aws-lambda/trigger/api-gateway-proxy";

export const handle: APIGatewayProxyHandler = async (event, _context) => {
  const path = event.path;
  return {
    statusCode: 200,
    body: path,
  };
}

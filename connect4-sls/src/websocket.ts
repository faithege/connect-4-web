import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { CustomResponse } from "./app";
import { getGameFromDatabase, updateConnectionId } from "./database";
import { Player } from "./models";

const documentClient = new DynamoDB.DocumentClient();
const gameTableName = process.env.DYNAMODB_TABLE;

export function generateResponseLog(statusCode: number, body: string | object | undefined): CustomResponse{
 const response = { 
  statusCode, 
  body: JSON.stringify(body)
}
console.log(`Response: ${JSON.stringify(response)}`)
  return response
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const context = event.requestContext;
  const sessionId = context.connectionId!;
  const routeKey = context.routeKey as "$connect" | "$disconnect" | "$default";

  console.log(JSON.stringify(context))
  console.log(JSON.stringify(event))

  if (!gameTableName){
    console.error("DYNAMOO_TABLE undefined")
    return generateResponseLog(503,"There\'s an internal configuration error")
  }       

  try {
    // Creating a websocket session ie store the connection id
    if (routeKey === "$connect") {
      const queryParams = event.queryStringParameters || {};
      const gameId = queryParams.gameId;
      const playerId = <Player>queryParams.playerId; // add in type guard pre-cast to make sure r or y?

      
      if (!gameId || !playerId) {
        return generateResponseLog(400, "gameId and playerId not provided")
      }

      // other issues what if gameId not red or yellow
      
      const game = await getGameFromDatabase(documentClient, gameTableName, gameId)
      console.log(`Game: ${JSON.stringify(game)}`)
      if (!game){
        return generateResponseLog(400, "Game not found")
      }
      const connectedGame = await updateConnectionId(documentClient, gameTableName, game.gameId, playerId, sessionId)
      return generateResponseLog(200, connectedGame)

      
    } else if (routeKey === "$disconnect") {
      // Delete Session
      
      ////
    } else {
      // All the other actions
    
    }
  } catch (e) {
    console.error("$default Error: %j\n%o", event.body, e);
    return generateResponseLog(500, `Malformed event body: ${event.body}`)
  }

  return generateResponseLog(200, 'Success')
};





/**
 *
 * Server -> Client Messaging features
 *
 */
// import * as AWS from "aws-sdk";

// const WebsocketAPIGatewayAddress = "https://42miiaobvk.execute-api.ap-northeast-2.amazonaws.com/prod";
// const apiGateway = new AWS.ApiGatewayManagementApi({ endpoint: WebsocketAPIGatewayAddress });

// async function sendMessageToClient(sessionId: string, message: ServerMessage) {
//   await apiGateway.postToConnection({
//     ConnectionId: sessionId,
//     Data: JSON.stringify(message),
//   }).promise();
// }

// async function broadcastMessageToClient(message: ServerMessage) {
//   const sessions = (await Session.primaryKey.scan({})).records;
//   await Promise.all(sessions.map((record) => sendMessageToClient(record.sessionId, message)));
// }
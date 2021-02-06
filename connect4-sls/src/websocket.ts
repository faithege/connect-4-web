import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from "aws-lambda";
import { DynamoDB , ApiGatewayManagementApi } from "aws-sdk";
import { getGameFromDatabase, updateConnectionId, updateGameInDatabase } from "./database";
import { checkBoardForWinner, placeCounter, switchCurrentPlayer } from "./game";
import { ClientColumn, ClientHello, ClientMessage, Game, Player, ServerError, ServerErrorMessage, ServerMessage } from "./models";
import { generateErrorMessage, generateGameMessage, generateWinnerMessage, getConnectionId, isClientMessage, isJsonString, isServerErrorMessage } from "./utils";

const documentClient = new DynamoDB.DocumentClient();
const maybeGameTableName = process.env.DYNAMODB_TABLE; // may or may not be defined

export function generateResponseLog(statusCode: number, body: string | object | undefined): APIGatewayProxyResult{
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

  if (!maybeGameTableName){
    console.error("DYNAMO_TABLE undefined")
    return generateResponseLog(503,"There\'s an internal configuration error")
  }   
  
  const gameTableName = maybeGameTableName //at this point we know that gameTableName exists

  try {
    // Creating a websocket session ie store the connection id
    if (routeKey === "$connect") {
      const queryParams = event.queryStringParameters || {};
      const gameId = queryParams.gameId;
      const playerId = <Player>queryParams.playerId; // add in type guard pre-cast to make sure r or y?

      
      if (!gameId || !playerId) {
        return generateResponseLog(400, "gameId and playerId not provided")
      }
      
      const game = await getGameFromDatabase(documentClient, gameTableName, gameId)
      console.log(`Game: ${JSON.stringify(game)}`)
      if (!game){
        return generateResponseLog(400, "Game not found")
      }
      const connectedGame = await updateConnectionId(documentClient, gameTableName, game.gameId, playerId, sessionId)

      return generateResponseLog(200, connectedGame)

      
    } else if (routeKey === "$disconnect") {
      // Delete Session
      
    } else {
      const payloadGameOrError: [ClientMessage, Game] | ServerErrorMessage = await verifyClientMessage(gameTableName, event)

      if (isServerErrorMessage(payloadGameOrError)){
        const error: ServerErrorMessage = payloadGameOrError
        sendMessageToClient (context.domainName!, context.stage, sessionId, error)
        return
      }

      const [payload, game]: [ClientMessage, Game] = payloadGameOrError


      switch(payload.type) {
        case ClientHello:
          await sendMessageToClient(context.domainName!, context.stage, sessionId, generateGameMessage(game.boardState, game.currentPlayer))
          break;
        case ClientColumn:
          //verify correct player making move
          if (payload.playerId !== game.currentPlayer){
            console.log(`Incorrect player making move, it is ${game.currentPlayer}'s turn`)
            await sendMessageToClient(context.domainName!, context.stage, sessionId, generateErrorMessage(`It is ${game.currentPlayer}'s turn`))
            //return generateResponseLog(400, "Incorrect player")
            break;
          }
          
          const updatedBoard = placeCounter(game.boardState, payload.column, game.currentPlayer)  // FE will ensure column is 0-indexed
          const nextPlayer = switchCurrentPlayer(game.currentPlayer)
          const winner = checkBoardForWinner(updatedBoard)

          //update db
          const updatedGame = await updateGameInDatabase(documentClient, gameTableName, game.gameId, updatedBoard, nextPlayer)

          if (updatedGame){
            const message = winner ? generateWinnerMessage(game.boardState, winner) : generateGameMessage(game.boardState, game.currentPlayer)
            await broadcastMessage(context.domainName!, context.stage, updatedGame, message) 
          }
          else{
            await sendMessageToClient(context.domainName!, context.stage, sessionId, generateErrorMessage("Unable to update game"))
          }
          break;

      }

        

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

async function verifyClientMessage(table: string, event: APIGatewayProxyEvent): Promise<[ClientMessage, Game] | ServerErrorMessage> {
  const context = event.requestContext
  const sessionId = context.connectionId!

  if(!event.body){
    return generateErrorMessage("Body missing")
  }

  // verify JSON format
  if (!isJsonString(event.body)){
    return generateErrorMessage("Invalid JSON")
  }

  const payload = JSON.parse(event.body);
  console.log(payload)

  // verify necessary message attributes provided
  if (!isClientMessage(payload)) {
    return generateErrorMessage("Invalid message format")
  }

  // verify game id
  const gameId = payload.gameId
  const playerId = payload.playerId
  const game = await getGameFromDatabase(documentClient, table, gameId)
  if (!game){
    return generateErrorMessage("Game does not exist", true)
  }

  // verify connection
  const gameConnectionId = getConnectionId(game, playerId)

  if (gameConnectionId !== sessionId){
    return generateErrorMessage("Illegal connection id", true)
  }

  return [payload, game];

}

async function broadcastMessage(domainName:string, stage:string, game: Game, message: ServerMessage) {

  if(game.connectionIdR){
    await sendMessageToClient(domainName, stage, game.connectionIdR, message)
  }
  if(game.connectionIdY){
    await sendMessageToClient(domainName, stage, game.connectionIdY, message)
  }
}

async function sendMessageToClient(domainName:string, stage:string, connectionId: string, message: ServerMessage) {
  const WebsocketAPIGatewayAddress = `https://${domainName}/${stage}`;
  const apiGateway = new ApiGatewayManagementApi({ endpoint: WebsocketAPIGatewayAddress });
  
  
  if (message.type === ServerError && message.disconnect){
    console.log(`Disconnecting user with connection id ${connectionId} because of error: ${message.error}`)
    await apiGateway.deleteConnection({
      ConnectionId: connectionId
    }).promise();
  }
  else{
    console.log(`Connection id ${connectionId}: ${message}`)
    await apiGateway.postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify(message),
    }).promise();
  }
}






/*
TODOS
- Send back board state, current player and winner (1 message)
- Error handling e.g. invalid col choice (full or doesn't exist), or play when not your turn, if playerId not red or yellow
 */
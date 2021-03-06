import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from "aws-lambda";
import { DynamoDB , ApiGatewayManagementApi } from "aws-sdk";
import { getGameFromDatabase, updateClientSecret, updateConnectionId, updateGameInDatabase } from "./database";
import { checkBoardForWinner, placeCounter, switchCurrentPlayer } from "./game";
import { Board, ClientColumn, ClientHello, ClientMessage, ColumnClientMessage, Game, GameId, Player, ServerError, ServerErrorMessage, ServerMessage } from "./models";
import { generateErrorMessage, generateGameMessage, generateWinnerMessage, getConnectionId, getSecretAccessToken, isClientMessage, isJsonString, isServerErrorMessage } from "./utils";

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
      const clientSecret = queryParams.secretAccessToken

      return await verifyClientConnection(gameTableName, gameId, playerId, clientSecret, sessionId)

      
    } else if (routeKey === "$disconnect") {
      // Remove connection id? Not 100% necessary as we overwrite
      // what params do we have? if no gameId - becomes expensive to go through entirety of game table
      
    } else {
      const payloadGameOrError: [ClientMessage, Game] | ServerErrorMessage = await verifyClientMessage(gameTableName, event)

      if (isServerErrorMessage(payloadGameOrError)){
        const error: ServerErrorMessage = payloadGameOrError
        sendMessageToClient (context.domainName!, context.stage, sessionId, error)
        return generateResponseLog(400, error)
      }

      const [payload, game]: [ClientMessage, Game] = payloadGameOrError


      switch(payload.type) {
        case ClientHello:
          await sendMessageToClient(context.domainName!, context.stage, sessionId, generateGameMessage(game.boardState, game.currentPlayer))
          break;
        case ClientColumn:
          const [message, boardState, nextPlayer] = processClientColumnChoice(payload, game)

          if (isServerErrorMessage(message)){
            await sendMessageToClient(context.domainName!, context.stage, sessionId, message)
            break;
          }

          //update db if client message acceptable
          const updatedGame = await updateGameInDatabase(documentClient, gameTableName, game.gameId, boardState, nextPlayer)

          if (updatedGame){
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

 function processClientColumnChoice(payload: ColumnClientMessage, game: Game): [ServerMessage, Board, Player]{
  let message

  //verify correct player making move
  if (payload.playerId !== game.currentPlayer){
    message = generateErrorMessage(`Incorrect player making move, it is ${game.currentPlayer}'s turn`)
    return [message, game.boardState, game.currentPlayer]
  }

  const updatedBoard = placeCounter(game.boardState, payload.column, game.currentPlayer)  // FE will ensure column is 0-indexed
  const nextPlayer = switchCurrentPlayer(game.currentPlayer)
  const winner = checkBoardForWinner(updatedBoard)
  message = winner ? generateWinnerMessage(game.boardState, winner) : generateGameMessage(game.boardState, game.currentPlayer)

  return [message, updatedBoard, nextPlayer]
 }

 async function verifyClientConnection(gameTableName: string, gameId: GameId, playerId: Player, clientSecret: string, sessionId: string): Promise<APIGatewayProxyResult> {
    if (!gameId || !playerId || !clientSecret) { // could do extra analysis e.g. is secret x characters long
      return generateResponseLog(400, "gameId, playerId, and access token must be provided")
    }
    
    const game = await getGameFromDatabase(documentClient, gameTableName, gameId)
    console.log(`Game: ${JSON.stringify(game)}`)
    if (!game){
      return generateResponseLog(400, "Game not found")
    }

    const databaseSecret = getSecretAccessToken(game, playerId)
    if(!databaseSecret){
      await updateClientSecret(documentClient, gameTableName, game.gameId, playerId, clientSecret) // only updated at the start so done separately from connection id
    }
    else if (databaseSecret !== clientSecret){
      return generateResponseLog(401, "Unauthorised access token")
    }

    const connectedGame = await updateConnectionId(documentClient, gameTableName, game.gameId, playerId, sessionId)

    return generateResponseLog(200, connectedGame)
 }


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
- Error handling e.g. invalid col choice (full or doesn't exist), or play when not your turn, if playerId not red or yellow
 */
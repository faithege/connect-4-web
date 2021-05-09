import { APIGatewayEventDefaultAuthorizerContext, APIGatewayEventRequestContextWithAuthorizer, APIGatewayProxyHandler, APIGatewayProxyResult} from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { getConnectionFromDatabase, updateConnection } from "./database/connectionsTable";
import { getGameFromDatabase, removeGameConnectionId, updateClientSecret, updateGameConnectionId, updateGameInDatabase } from "./database/gameTable";
import { checkBoardForWinner, placeCounter, switchCurrentPlayer } from "./game";
import { isServerErrorMessage, generateGameMessage, generateErrorMessage, generateWinnerMessage, broadcastMessage, sendMessageToClient, verifyClientMessage, generatePresenceMessage } from "./message";
import { Board, ClientColumn, ClientHello, ClientMessage, ColumnClientMessage, Game, GameId, Player, ServerErrorMessage, ServerMessage } from "./model";
import { getSecretAccessToken } from "./utils";

const documentClient = new DynamoDB.DocumentClient();
const maybeGameTableName = process.env.DYNAMODB_TABLE; // may or may not be defined
const maybeConnectionsTableName = process.env.DYNAMODB_CONNECTIONS_TABLE; 

export function generateResponseLog(statusCode: number, body: string | object | undefined): APIGatewayProxyResult{
  const response = { 
    statusCode, 
    body: JSON.stringify(body)
  }
  console.log(`generateResponseLog response: ${JSON.stringify(response)}`)
  return response
}

type Context = APIGatewayEventRequestContextWithAuthorizer<APIGatewayEventDefaultAuthorizerContext>

export const handler: APIGatewayProxyHandler = async (event) => {
  const context: Context = event.requestContext;
  const sessionId = context.connectionId!;
  const routeKey = context.routeKey as "$connect" | "$disconnect" | "$default";

  console.log(`event context: ${JSON.stringify(context)}`)
  console.log(`event: ${JSON.stringify(event)}`)

  if (!maybeGameTableName){
    console.error("DYNAMO_TABLE undefined")
    return generateResponseLog(503,"There\'s an internal configuration error")
  }
  
  if (!maybeConnectionsTableName){
    console.error("DYNAMO_CONNECTIONS_TABLE undefined")
    return generateResponseLog(503,"There\'s an internal configuration error")
  }   
  
  const gameTableName = maybeGameTableName //at this point we know that gameTableName exists
  const connectionsTableName = maybeConnectionsTableName

  try {
    // Creating a websocket session ie store the connection id
    if (routeKey === "$connect") {
      const queryParams = event.queryStringParameters || {};
      const gameId = queryParams.gameId;
      const playerId = <Player>queryParams.playerId; // add in type guard pre-cast to make sure r or y?
      const clientSecret = queryParams.secretAccessToken

      return await verifyClientConnection(gameTableName, connectionsTableName, gameId, playerId, clientSecret, sessionId)

      
    } else if (routeKey === "$disconnect") {
      console.log(`DISCONNECT EVENT:`, event)

      //LU game Id in connections table
      const playerConnection = await getConnectionFromDatabase(documentClient, connectionsTableName, sessionId)
      
      if (!playerConnection){
        return generateResponseLog(400, "Connection not found")
      }

      //update game table to set disconnected connection Id to undefined
      const maybeDisconnectedGame = await removeGameConnectionId(documentClient, gameTableName, playerConnection.gameId, sessionId)

      if (maybeDisconnectedGame){
        const disconnectedGame = maybeDisconnectedGame
        broadcastMessage(context.domainName!, context.stage, disconnectedGame, generatePresenceMessage(disconnectedGame))
      }

      
    } else {
      const payloadGameOrError: [ClientMessage, Game] | ServerErrorMessage = await verifyClientMessage(documentClient, gameTableName, event)

      if (isServerErrorMessage(payloadGameOrError)){
        const error: ServerErrorMessage = payloadGameOrError
        sendMessageToClient (context.domainName!, context.stage, sessionId, error)
        return generateResponseLog(400, error)
      }

      const [payload, game]: [ClientMessage, Game] = payloadGameOrError


      switch(payload.type) {
        case ClientHello:
          await sendMessageToClient(context.domainName!, context.stage, sessionId, generateGameMessage(game.boardState, game.currentPlayer))
          await broadcastMessage(context.domainName!, context.stage, game, generatePresenceMessage(game))
          //broadcast presence - do here rather than verify connection, then person who has connected will get it too as sent to Y and R
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

 async function verifyClientConnection(gameTableName: string, connectionsTableName: string,gameId: GameId, playerId: Player, clientSecret: string, sessionId: string): Promise<APIGatewayProxyResult> {
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

    const connectedGame = await updateGameConnectionId(documentClient, gameTableName, game.gameId, playerId, sessionId)
    await updateConnection(documentClient, connectionsTableName, game.gameId, sessionId)
    

    return generateResponseLog(200, connectedGame)
 }











/*
TODOS
- Error handling e.g. invalid col choice (full or doesn't exist), or play when not your turn, if playerId not red or yellow
 */
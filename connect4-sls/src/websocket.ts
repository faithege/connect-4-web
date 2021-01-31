import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB , ApiGatewayManagementApi } from "aws-sdk";
import { getGameFromDatabase, updateConnectionId, updateGameInDatabase } from "./database";
import { placeCounter, switchCurrentPlayer } from "./game";
import { Board, Game, Player, ServerError, ServerGame, ServerMessage } from "./models";
import { getConnectionId, isClientMessage, isJsonString } from "./utils";

const documentClient = new DynamoDB.DocumentClient();
const gameTableName = process.env.DYNAMODB_TABLE;

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
      if(event.body){

        // verify JSON format
        if (!isJsonString(event.body)){
          await sendMessageToClient(context.domainName!, context.stage, sessionId, generateErrorMessage("Invalid JSON"))
        }

        const payload = JSON.parse(event.body);
        console.log(payload)

        // verify necessary message attributes provided
        if (!isClientMessage(payload)) {
          await sendMessageToClient(context.domainName!, context.stage, sessionId, generateErrorMessage("Invalid message format"))
        }

        // verify game id
        const gameId = payload.gameId
        const playerId = payload.playerId
        const game = await getGameFromDatabase(documentClient, gameTableName, gameId)
        if (!game){
          console.log("Game does not exist")
          disconnectClient(context.domainName!, context.stage, sessionId)
          return generateResponseLog(400, "Game does not exist")
        }

        // verify connection
        const gameConnectionId = getConnectionId(game, playerId)

        if (gameConnectionId !== sessionId){
          console.log("Illegal connection id")
          disconnectClient(context.domainName!, context.stage, sessionId)
        }

        //different logic here - put above code into its own function

        switch(payload.messageType) {
          case "hello":
            await sendMessageToClient(context.domainName!, context.stage, sessionId, generateGameMessage(game.boardState, game.currentPlayer))
            break;
          case "column":
            //verify correct player making move
            if (playerId !== game.currentPlayer){
              console.log(`Incorrect player making move, it is ${game.currentPlayer}'s turn`)
              await sendMessageToClient(context.domainName!, context.stage, sessionId, generateErrorMessage(`It is ${game.currentPlayer}'s turn`))
              //return generateResponseLog(400, "Incorrect player")
              break;
            }
           
            const updatedBoard = placeCounter(game.boardState, payload.column, game.currentPlayer)  // FE will ensure column is 0-indexed
            const nextPlayer = switchCurrentPlayer(game.currentPlayer)

            //update db
            const updatedGame = await updateGameInDatabase(documentClient, gameTableName, game.gameId, updatedBoard, nextPlayer)

            if (updatedGame){
              // make a helper function here to broadcast message to all(both) clients
              broadcastGameMessage(context.domainName!, context.stage, updatedGame)
            }
            else{
              await sendMessageToClient(context.domainName!, context.stage, sessionId, generateErrorMessage("Unable to update game"))
            }
            break;

        }

        

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


function generateErrorMessage(errorString: string): ServerError{
  return {
    messageType: "error",
    error: errorString
  }
}

function generateGameMessage(board: Board, currentPlayer: Player): ServerGame{
  return {
    messageType: "game",
    boardState: board,
    currentPlayer: currentPlayer
  }
}

async function broadcastGameMessage(domainName:string, stage:string, game: Game) {
  if(game.connectionIdR){
    await sendMessageToClient(domainName, stage, game.connectionIdR, generateGameMessage(game.boardState, game.currentPlayer))
  }
  if(game.connectionIdY){
    await sendMessageToClient(domainName, stage, game.connectionIdY, generateGameMessage(game.boardState, game.currentPlayer))
  }
}

async function sendMessageToClient(domainName:string, stage:string, connectionId: string, message: ServerMessage) {
  const WebsocketAPIGatewayAddress = `https://${domainName}/${stage}`;
  const apiGateway = new ApiGatewayManagementApi({ endpoint: WebsocketAPIGatewayAddress });

  await apiGateway.postToConnection({
    ConnectionId: connectionId,
    Data: JSON.stringify(message),
  }).promise();
}

async function disconnectClient(domainName:string, stage:string, connectionId: string) {
  const WebsocketAPIGatewayAddress = `https://${domainName}/${stage}`;
  const apiGateway = new ApiGatewayManagementApi({ endpoint: WebsocketAPIGatewayAddress });

  await apiGateway.deleteConnection({
    ConnectionId: connectionId
  }).promise();
}






/*
TODOS
- Send back board state, current player and winner (1 message)
- Error handling e.g. invalid col choice (full or doesn't exist), or play when not your turn, if playerId not red or yellow
 */
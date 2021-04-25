// type guard clientMessage to ensure all the correct attributes are present

import { APIGatewayProxyEvent } from "aws-lambda";
import { ApiGatewayManagementApi } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { getGameFromDatabase } from "./database/gameTable";
import { ClientMessage, ClientHello, ClientColumn, ServerErrorMessage, ServerError, Board, Player, ServerGameMessage, ServerGame, ServerWinnerMessage, ServerWinner, Game, ServerMessage, ServerPresence, ServerPresenceMessage } from "./model";
import { isJsonString, getConnectionId } from "./utils";

// is there a better way to do this?
export function isClientMessage(value: ClientMessage ): value is ClientMessage { 
    return typeof value.gameId === 'string' && 
            typeof value.playerId === 'string' &&
            ( value.playerId === 'r' || value.playerId === 'y') &&
            typeof value.type === 'string' && 
            ( value.type === ClientHello || value.type=== ClientColumn);
  }


export function isServerErrorMessage(value: any ): value is ServerErrorMessage { 
return 'type' in value && value.type === ServerError;
}


export function generateErrorMessage(errorString: string, shouldDisconnect: boolean = false): ServerErrorMessage{
    return {
      type: ServerError,
      error: errorString,
      disconnect: shouldDisconnect
    }
  }
  
export function generateGameMessage(board: Board, currentPlayer: Player): ServerGameMessage{
    return {
      type: ServerGame,
      boardState: board,
      currentPlayer: currentPlayer
    }
  }
  
export function generateWinnerMessage(board: Board, winner: Player): ServerWinnerMessage{
    return {
      type: ServerWinner,
      boardState: board,
      winner: winner
    }
}

export async function broadcastMessage(domainName:string, stage:string, game: Game, message: ServerMessage) {

    if(game.connectionIdR){
        await sendMessageToClient(domainName, stage, game.connectionIdR, message)
    }
    if(game.connectionIdY){
        await sendMessageToClient(domainName, stage, game.connectionIdY, message)
    }
}

export async function broadcastPresence(domainName:string, stage:string, game: Game) {

    const message: ServerPresenceMessage = {
        type: ServerPresence,
        playerRPresent: game.connectionIdR !== undefined,
        playerYPresent: game.connectionIdY !== undefined
    }

    // can't send messages to self when (dis)connecting

    broadcastMessage(domainName, stage, game, message)
}

export async function sendMessageToClient(domainName:string, stage:string, connectionId: string, message: ServerMessage) {
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

export async function verifyClientMessage(documentClient: DocumentClient, table: string, event: APIGatewayProxyEvent): Promise<[ClientMessage, Game] | ServerErrorMessage> {
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
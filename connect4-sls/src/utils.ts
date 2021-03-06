import { Board, ClientColumn, ClientHello, ClientMessage, Game, GameId, Player, ServerError, ServerErrorMessage, ServerGame, ServerGameMessage, ServerWinner, ServerWinnerMessage } from "./models";

export function isJsonString(str: string): boolean {
    try {
        JSON.parse(str);
    } catch (error) {
        return false;
    }
    return true;
}

export function generateId() :GameId {
  const idLength = 32 //how long we want the game id -> the bigger the less liklihood of collision
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  const result = Array(idLength).fill(undefined)
                                  .map(_ => characters.charAt(Math.floor(Math.random() * charactersLength)))
                                  .join('')
  return result;
}

//SH says this would not scale (presumably if have players other that r/y), but the code is clean!
export function getConnectionId(game: Game, player: Player): string | undefined{
    return player === 'r' ? game.connectionIdR : game.connectionIdY
}

export function getSecretAccessToken(game: Game, player: Player): string | undefined{
  return player === 'r' ? game.secretAccessTokenR : game.secretAccessTokenY
}

// type guard clientMessage to ensure all the correct attributes are present
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
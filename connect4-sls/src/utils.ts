import { Board, ClientColumn, ClientHello, ClientMessage, Game, Player, ServerError, ServerErrorMessage, ServerGame, ServerGameMessage, ServerWinner, ServerWinnerMessage } from "./models";

export function isJsonString(str: string): boolean {
    try {
        JSON.parse(str);
    } catch (error) {
        return false;
    }
    return true;
}

//SH says this would not scale (presumably if have players other that r/y), but the code is clean!
export function getConnectionId(game: Game, player: Player): string | undefined{
    return player === 'r' ? game.connectionIdR : game.connectionIdY
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
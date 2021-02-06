export type GameId = string
export type Player = "r" | "y" 
export type Place = Player | "." //either a player or an empty space
export type Row = Place[] //array of 7 places, no longer a tuple
export type Column = Place[] //array of 6 places, no longer a tuple
export type Board = Row[] //now an array rather than a tuple (mapping a tuple, turns into an array and returns an array of noon fixed length)

export interface Game {
    gameId: string
    dateCreated:string
    boardState: Board
    currentPlayer: Player
    connectionIdR: string | undefined
    connectionIdY: string | undefined
}

interface Message {
	type: string;
}

export const ClientHello = "CLIENT_HELLO" as const;
export const ClientColumn = "CLIENT_COLUMN" as const;

export interface ClientMessageFields extends Message{
    gameId: string
    playerId: Player
}

export interface ColumnClientMessage extends ClientMessageFields{
    // This is 0-indexed by the FE
    type: typeof ClientColumn
    column: number 
}

export interface HelloClientMessage extends ClientMessageFields{
    // This is 0-indexed by the FE
    type: typeof ClientHello
}

export type ClientMessage = ColumnClientMessage | HelloClientMessage;

export const ServerError = "SERVER_ERROR" as const;
export const ServerGame = "SERVER_GAME" as const;
export const ServerWinner= "SERVER_WINNER" as const;


export interface ServerErrorMessage extends Message{
    type: typeof ServerError
    error: string
    disconnect: boolean
}

export interface ServerGameMessage extends Message{
    type: typeof ServerGame
    boardState: Board
    currentPlayer: Player
}

export interface ServerWinnerMessage extends Message{
    type: typeof ServerWinner
    boardState: Board
    winner: Player
}

export type ServerMessage = ServerErrorMessage | ServerGameMessage | ServerWinnerMessage



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

export interface ClientMessage {
    gameId: string
    playerId: Player
    messageType: "hello" | "column"
}

export interface ColumnClientMessage extends ClientMessage{
    // This is 0-indexed by the FE
    column: number 
}

export interface ServerMessage {
    messageType: "error" | "game" | "winner"
}

export interface ServerError extends ServerMessage{
    error: string
}

export interface ServerGame extends ServerMessage{
    boardState: Board
    currentPlayer: Player
}

export interface ServerWinner extends ServerMessage{
    boardState: Board
    winner: Player
}

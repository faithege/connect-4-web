import { ClientMessage, Game, Player } from "./models";

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
            typeof value.messageType === 'string' && 
            ( value.messageType === 'hello' || value.messageType=== 'column');
  }
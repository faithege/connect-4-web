import { Game, GameId, Player } from "./model";

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


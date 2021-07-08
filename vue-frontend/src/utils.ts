import { Player } from "./model"

export function generateOtherPlayer(playerId: Player): Player | undefined{
    if (playerId == 'r') {
        return 'y'
    }
    else if (playerId === 'y') {
        return 'r'
    }
    else return undefined
}
export function generateId() :GameId {
    const idLength = 32 //how long we want the game id -> the bigger the less liklihood of collision
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    const result = Array(idLength).fill(undefined)
                                    .map(_ => characters.charAt(Math.floor(Math.random() * charactersLength)))
                                    .join('')
    return result;
  }
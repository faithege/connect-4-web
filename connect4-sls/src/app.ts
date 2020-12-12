import { addGameToDatabase, generateGameId, generateNewGame, getGameFromDatabase, updateGameInDatabase } from "./database";
import { Game, Player } from "./models";
import { switchCurrentPlayer } from "./game";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

export interface CustomResponse {
  statusCode: number
  body: string | object
}

export function generateResponse(statusCode: number, body: string | object): CustomResponse{
  return { 
    statusCode, 
    body
  }
}

export async function postNewGame(documentClient: DocumentClient, tableName: string): Promise<CustomResponse>{
  const newGame = generateNewGame(generateGameId(), new Date(), "r")
  const savedGame = await addGameToDatabase(documentClient, tableName, newGame)
  return generateResponse(200, savedGame)
}

export async function getGame(documentClient: DocumentClient, tableName: string, gameId: string): Promise<CustomResponse>{
  const game = await getGameFromDatabase(documentClient, tableName, gameId)
  if (game){
    return generateResponse(200, game)
  } else {
    return generateResponse(404, "Game could not be found")
  }
}







// export async function updateGame(documentClient: DocumentClient, tableName: string, gameId: string, column: number, player: Player): Promise<CustomResponse>{
//   //get game from db
//       //check exists
//       //check current player from db matches incoming player
//   //place counter from game using logic
//   //update db

//   //check winner


//    if (resource === '/game' && method === 'PUT'){
//       //update board logic here
//       const mockGameUpdate: Game = {
//         gameId: 'vQCY1iMbai8j23FV22UDoo2bBGVErTRv',
//         dateCreated: '2020-12-01T20:23:09.665Z',
//         currentPlayer: 'r',
//         boardState: [ 
//           [".",".",".",".",".",".","."],
//           [".",".",".",".",".",".","."],
//           [".",".",".",".",".",".","."],
//           [".",".",".",".",".",".","."],
//           [".",".",".",".",".",".","."],
//           ["r","y",".",".",".",".","."]
//           ]
//       }

//       const savedGame = await updateGameInDatabase(documentClient, tableName, mockGameUpdate)

//       // if gaame save successful
//       //check for winner
//       //otherwise switch player
//       const nextPlayer = switchCurrentPlayer(mockGameUpdate.currentPlayer)
//       return generateResponse(200, JSON.stringify({
//                                       game: savedGame,
//                                       nextPlayer: nextPlayer
//                                     }))
//     }


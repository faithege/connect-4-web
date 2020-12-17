import { addGameToDatabase, generateGameId, generateNewGame, getGameFromDatabase, updateGameInDatabase } from "./database";
import { Game, Player } from "./models";
import { processPlayerMove, switchCurrentPlayer } from "./game";
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

export async function updateExistingGame(documentClient: DocumentClient, tableName: string, gameId: string, clientPlayer: Player, userMove: string): Promise<CustomResponse>{
  
  // first check game exists
  const game = await getGameFromDatabase(documentClient, tableName, gameId)
  if (!game){
    return generateResponse(404, "Game could not be found")
  }

  // then check current player from client matches that of DB
  if (game.currentPlayer !== clientPlayer){
    return generateResponse(403, `Illegal Move: It is ${game.currentPlayer}'s turn`)
  }

  const updatedBoard = await processPlayerMove(userMove, game.boardState, game.currentPlayer)
  const nextPlayer = switchCurrentPlayer(game.currentPlayer)

  const savedGame = await updateGameInDatabase(documentClient, tableName, game.gameId, updatedBoard, nextPlayer)

  if (savedGame){
    return generateResponse(200, savedGame)
  }
  else{
    console.error(`Issue with updating game ${game.gameId}`)
    return generateResponse(503, "Internal Server Error")
  }

  
  
  
  //how do we do this all at once?
  //check winner
}



//       

//       // if gaame save successful
//       //check for winner
//       //otherwise switch player
//       
//       return generateResponse(200, JSON.stringify({
//                                       game: savedGame,
//                                       nextPlayer: nextPlayer
//                                     }))
//     }


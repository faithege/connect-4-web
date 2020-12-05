import { APIGatewayProxyHandler } from "aws-lambda/trigger/api-gateway-proxy";
import { addGameToDatabase, generateGameId, generateNewGame, getGameFromDatabase, updateGameInDatabase } from "./database";
import { DynamoDB } from 'aws-sdk'; 
import { Game } from "./models";
import { switchCurrentPlayer } from "./game";

function generateResponse(statusCode: number, body: string){
  return { 
    statusCode: statusCode, 
    body: body + "\n"
  }
}

export const handle: APIGatewayProxyHandler = async (event, _context) => {

  const documentClient = new DynamoDB.DocumentClient();
  const tableName = process.env.DYNAMODB_TABLE;

  const resource = event.resource;
  const method = event.httpMethod;

  console.log(`event ${JSON.stringify(event)}`)
  

  if (!tableName) {
    console.error('ENV VAR DYNAMODB_TABLE has not been defined')
    return generateResponse(500, 'There\'s an internal configuration error')
  }

  try{
    if (resource === '/new' && method === 'POST'){
      const newGame = generateNewGame(generateGameId(), new Date(), "r")
      const savedGame = await addGameToDatabase(documentClient, tableName, newGame)
      return generateResponse(201, JSON.stringify(savedGame))
    }
    else if (resource === '/game/{gameId}' && method === 'GET'){
      const gameId = event.pathParameters?.gameId

      if(gameId){
        const game = await getGameFromDatabase(documentClient, tableName, gameId)
        if (game){
          return generateResponse(200, JSON.stringify(game))
        } else {
          return generateResponse(404, "Game could not be found")
        }
        
      }
      else {
        return generateResponse(400, "Missing Game Id")
      }
    }
    else if (resource === '/game' && method === 'PUT'){
      //update board logic here
      const mockGameUpdate: Game = {
        gameId: 'vQCY1iMbai8j23FV22UDoo2bBGVErTRv',
        dateCreated: '2020-12-01T20:23:09.665Z',
        currentPlayer: 'r',
        boardState: [ 
          [".",".",".",".",".",".","."],
          [".",".",".",".",".",".","."],
          [".",".",".",".",".",".","."],
          [".",".",".",".",".",".","."],
          [".",".",".",".",".",".","."],
          ["r","y",".",".",".",".","."]
          ]
      }

      const savedGame = await updateGameInDatabase(documentClient, tableName, mockGameUpdate)

      // if gaame save successful
      //check for winner
      //otherwise switch player
      const nextPlayer = switchCurrentPlayer(mockGameUpdate.currentPlayer)
      return generateResponse(200, JSON.stringify({
                                      game: savedGame,
                                      nextPlayer: nextPlayer
                                    }))
    }
    else{
      return generateResponse(404, "Not found")
    }

  }
  catch (error) {
    console.log('error:', error);
    return generateResponse(503, error)
  }

  
}

/* Next Steps-Want our DB calls to be atomic (transactional - all or nothing) so if one part fails, all fail
--Flip Player
--Insert a Counter
-Need a way to determine starting player - currently hardcoded as red
*/

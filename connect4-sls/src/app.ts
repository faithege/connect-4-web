import { APIGatewayProxyHandler } from "aws-lambda/trigger/api-gateway-proxy";
import { addGameToDatabase, generateGameId, generateNewGame, getGameFromDatabase } from "./database";
import { DynamoDB } from 'aws-sdk'; 

function generateResponse(statusCode: Number, body: String){
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
      return generateResponse(200, JSON.stringify(savedGame))
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

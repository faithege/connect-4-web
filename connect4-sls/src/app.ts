import { APIGatewayProxyHandler } from "aws-lambda/trigger/api-gateway-proxy";
import { addGameToDatabase, generateGameId, generateNewGame, getGameFromDatabase } from "./database";
import { DynamoDB } from 'aws-sdk'; 

export const handle: APIGatewayProxyHandler = async (event, _context) => {

  const documentClient = new DynamoDB.DocumentClient();
  const tableName = process.env.DYNAMODB_TABLE;

  const resource = event.resource;
  const method = event.httpMethod;

  console.log(`event ${JSON.stringify(event)}`)
  

  if (!tableName) {
    console.error('ENV VAR DYNAMODB_TABLE has not been defined')
    return { 
      statusCode: 500, 
      body: 'There\'s an internal configuration error' 
    };
  }

  try{
    if (resource === '/new' && method === 'POST'){
      const newGame = generateNewGame(generateGameId(), new Date(), "r")
      const savedGame = await addGameToDatabase(documentClient, tableName, newGame)

      return {
        statusCode: 200,
        body: JSON.stringify(savedGame) + "\n",
      };
    }
    else if (resource === '/game/{gameId}' && method === 'GET'){
      const gameId = event.pathParameters?.gameId

      if(gameId){
        const game = await getGameFromDatabase(documentClient, tableName, gameId)
        if (game){
          return {
            statusCode: 200,
            body: JSON.stringify(game)+ "\n",
          };
        } else {
          return {
            statusCode: 404,
            body: "Game could not be found"+ "\n",
          };
        }
        
      }
      else {
        return {
          statusCode: 400,
          body: "Missing Game Id" + "\n",
        };
      }
    }
    else{
      return {
        statusCode: 404,
        body: "Not found" + "\n",
      };
    }

  }
  catch (error) {
    console.log('error:', error);
    return { 
      statusCode: 503, 
      body: error 
    };
  }

  
}

/* Next Steps-Want our DB calls to be atomic (transactional - all or nothing) so if one part fails, all fail
--Flip Player
--Insert a Counter
-Need a way to determine starting player - currently hardcoded as red
*/

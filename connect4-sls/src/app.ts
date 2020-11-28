import { APIGatewayProxyHandler } from "aws-lambda/trigger/api-gateway-proxy";
import { addGameToDatabase, generateGameId, generateNewGame } from "./database";
import { DynamoDB } from 'aws-sdk'; 

const documentClient = new DynamoDB.DocumentClient();
const tableName = process.env.DYNAMODB_TABLE;

export const handle: APIGatewayProxyHandler = async (event, _context) => {

  const path = event.path;
  const method = event.httpMethod;

  if (!tableName) {
    console.error('ENV VAR DYNAMODB_TABLE has not been defined')
    return { 
      statusCode: 500, 
      body: 'There\'s an internal configuration error' };
  }

  try{
    if (path === '/new' && method === 'POST'){
      const newGame = generateNewGame(generateGameId(), new Date(), "r")
      const savedGame = await addGameToDatabase(documentClient, tableName, newGame)

      return {
        statusCode: 200,
        body: JSON.stringify(savedGame) + "\n",
      };
    }
    else if (path === '/game' && method === 'GET'){
      return {
        statusCode: 200,
        body: "Hello Faith" + "\n",
      };
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

/* Next Steps
-Given a GameID get a game
-Add Appropriate Routes /new get post put - (game status, start a new game, update an existing game)
-Want our DB calls to be atomic (transactional - all or nothing) so if one part fails, all fail
--Flip Player
--Insert a Counter
-Need a way to determine starting player - currently hardcoded as red
*/

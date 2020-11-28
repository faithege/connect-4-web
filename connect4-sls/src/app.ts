import { APIGatewayProxyHandler } from "aws-lambda/trigger/api-gateway-proxy";
import { addGameToDatabase, generateGameId, generateNewGame } from "./database";
import { DynamoDB } from 'aws-sdk'; 



export const handle: APIGatewayProxyHandler = async (event, _context) => {

  const documentClient = new DynamoDB.DocumentClient();
  const tableName = process.env.DYNAMODB_TABLE;

  if (!tableName) {
    console.error('ENV VAR DYNAMODB_TABLE has not been defined')
    return { 
      statusCode: 500, 
      body: 'There\'s an internal configuration error' };
  }

  const newGame = generateNewGame(generateGameId(), new Date(), "r")
  const savedGame = await addGameToDatabase(documentClient, tableName, newGame)

  return {
    statusCode: 200,
    body: JSON.stringify(savedGame) + "\n",
  };
}

/* Next Steps
-Given a GameID get a game
-Add Appropriate Routes /new get post put - (game status, start a new game, update an existing game)
-Want our DB calls to be atomic (transactional - all or nothing) so if one part fails, all fail
--Flip Player
--Insert a Counter
-Need a way to determine starting player - currently hardcoded as red
/*

import { Board, Game, GameId, Player } from "./models";
import { DocumentClient } from "aws-sdk/clients/dynamodb";


export function generateGameId() :GameId {
    const idLength = 32 //how long we want the game id -> the bigger the less liiklihood of collision
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    const result = Array(idLength).fill(undefined)
                                    .map(_ => characters.charAt(Math.floor(Math.random() * charactersLength)))
                                    .join('')
    return result;
 }

function generateEmptyBoard(): Board {
    return [ 
        [".",".",".",".",".",".","."],
        [".",".",".",".",".",".","."],
        [".",".",".",".",".",".","."],
        [".",".",".",".",".",".","."],
        [".",".",".",".",".",".","."],
        [".",".",".",".",".",".","."]
        ]
}

export function generateNewGame(gameId: GameId, dateTime: Date, startingPlayer: Player) : Game{
    
    return {
        gameId: gameId,
        dateCreated: dateTime.toISOString(), //needs to be a string for the ddb
        currentPlayer: startingPlayer,
        boardState: generateEmptyBoard(),
        connectionIdR: undefined,
        connectionIdY: undefined
    }
}

//arguments that will change most, put to RHS
export async function addGameToDatabase(documentClient: DocumentClient, tableName:string, game: Game): Promise<Game> {
    
    await documentClient.put({
        TableName: tableName,
        Item: game
    }).promise()

    return game

    //We had tried to make use of ReturnValues to return the updated Item but got the error from AWS
            // "ReturnValues can only be ALL_OLD or NONE"
    // if (savedGame.Attributes){
    //     return <Game>savedGame.Attributes
    // }
    
    //dealing with theoretical undefined situation
    // return Promise.reject(new Error("Game saving failed"))
}

export async function getGameFromDatabase(documentClient: DocumentClient, tableName:string, id: string): Promise<Game | undefined>{
    const params: DocumentClient.GetItemInput = {
        TableName : tableName,
        Key: {
            gameId: id
        }
    }

    const response = await documentClient.get(params).promise()

    // Handle the case where an incorrect id is passed in (returns {} and so cannot be cast to a Game type)
    if(response.Item){
        // cast to a game
        return <Game>response.Item
    }
    else{
        return undefined
    }

}

export async function updateGameInDatabase(documentClient: DocumentClient, tableName:string, gameId: string, updatedBoard: Board, newPlayer: Player): Promise<Game | undefined>{

    const params = {
        TableName: tableName,
        Key: { gameId : gameId },
        UpdateExpression: 'set #board = :b, #player = :p ',
        ExpressionAttributeNames: {'#board' : 'boardState', '#player' : 'currentPlayer'},
        ExpressionAttributeValues: {
          ':b' : updatedBoard,
          ':p' : newPlayer,
        },
        ReturnValues: 'ALL_NEW'
    }

    const savedGame = await documentClient.update(params).promise();

    if (savedGame.Attributes){
        return <Game>savedGame.Attributes
    }
    else{
        return undefined // what is the error happening here? Add better handling/logging here - should give as much detail as possible
    }

}

export async function updateConnectionId(documentClient: DocumentClient, tableName:string, gameId: string, newPlayer: Player, connectionId: string): Promise<Game | undefined>{
    const params = {
        TableName: tableName,
        Key: { gameId : gameId },
        UpdateExpression: 'set #connection = :c',
        ExpressionAttributeNames: {'#connection' : `connectionId${newPlayer.toUpperCase()}`},
        ExpressionAttributeValues: {
          ':c' : connectionId
        },
        ReturnValues: 'ALL_NEW'
    }

    console.log(JSON.stringify(params))

    const savedGame = await documentClient.update(params).promise();
    console.log(`${JSON.stringify(savedGame)}`)

    if (savedGame.Attributes){
        return <Game>savedGame.Attributes
    }
    else{
        return undefined // what is the error happening here? Add better handling/logging here - should give as much detail as possible
    }

}

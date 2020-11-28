import { Board, Game, GameId, Player } from "./models";
import { DocumentClient, ItemList, Key, ScanInput } from "aws-sdk/clients/dynamodb";


export function generateGameId() :GameId {
    const length = 32 //how long we want the game id -> the bigger the less liiklihood of collision
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
    //task - get rid of for loop, recursion or empty array and map
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
        boardState: generateEmptyBoard()
    }
}

//arguments that will change most, put to RHS
export async function addGameToDatabase(documentClient: DocumentClient, tableName:string, game: Game): Promise<Game> {
    await documentClient.put({
        TableName: tableName,
        Item: game
    }).promise()

    return game
    // if (savedGame.Attributes){
    //     return <Game>savedGame.Attributes
    // }
    
    //dealing with theoretical undefined situation
    // return Promise.reject(new Error("Game saving failed"))
}
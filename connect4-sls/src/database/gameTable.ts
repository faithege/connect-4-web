import { Board, Game, GameId, Player } from "../model";
import { DocumentClient, UpdateItemOutput } from "aws-sdk/clients/dynamodb";


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
        connectionIdY: undefined,
        secretAccessTokenR: undefined,
        secretAccessTokenY: undefined
    }
}

//arguments that will change most, put to RHS
export async function addGameToDatabase(documentClient: DocumentClient, gameTableName:string, game: Game): Promise<Game> {
    
    await documentClient.put({
        TableName: gameTableName,
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

export async function getGameFromDatabase(documentClient: DocumentClient, gameTableName:string, id: string): Promise<Game | undefined>{
    const params: DocumentClient.GetItemInput = {
        TableName : gameTableName,
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

export async function updateGameInDatabase(documentClient: DocumentClient, gameTableName:string, gameId: string, updatedBoard: Board, newPlayer: Player): Promise<Game | undefined>{

    const params = {
        TableName: gameTableName,
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

export async function updateGameConnectionId(documentClient: DocumentClient, gameTableName:string, gameId: string, newPlayer: Player, connectionId: string): Promise<Game | undefined>{
    const params = {
        TableName: gameTableName,
        Key: { gameId : gameId },
        UpdateExpression: 'set #connection = :c',
        ExpressionAttributeNames: {'#connection' : `connectionId${newPlayer.toUpperCase()}`},
        ExpressionAttributeValues: {
          ':c' : connectionId
        },
        ReturnValues: 'ALL_NEW'
    }

    console.log(`updateGameConnectionId (request): ${JSON.stringify(params)}`)

    const savedGame = await documentClient.update(params).promise();
    console.log(`updateGameConnectionId (result): ${JSON.stringify(savedGame)}`)

    if (savedGame.Attributes){
        return <Game>savedGame.Attributes
    }
    else{
        return undefined // what is the error happening here? Add better handling/logging here - should give as much detail as possible
    }

}

export async function removeGameConnectionId(documentClient: DocumentClient, gameTableName:string, gameId: string, sessionId: string): Promise<Game | undefined>{


    function generateParams(playerId: Player){
        const params = {
            TableName: gameTableName,
            Key: { gameId : gameId },
            UpdateExpression: 'remove #connection',
            ExpressionAttributeNames: {'#connection' : `connectionId${playerId.toUpperCase()}`},
            ConditionExpression: '#connection = :session',
            ExpressionAttributeValues: {
              ':session': sessionId
            },
            ReturnValues: 'ALL_NEW'
        }
    
        console.log(`removeGameConnectionId (request) : ${JSON.stringify(params)}`)

        return params
    }

    //we're telling the compiler that the result is a fulflled result if the return statement is true
    function isFulfilled<T>(result: PromiseSettledResult<T> ): result is PromiseFulfilledResult<T> { 
        return result.status === 'fulfilled';
    }

  
    //For typing we checked what the inbuilt JS/AWs functions would return
    const result: PromiseSettledResult<UpdateItemOutput>[] = await Promise.allSettled([
        documentClient.update(generateParams('r')).promise(), 
        documentClient.update(generateParams('y')).promise()
    ]);
    console.log(`removeGameConnectionId (result) : ${JSON.stringify(result)}`)

    const [resultR, resultY] = result

    /*
    resultR  =>  {status: 'ful', value: updateResult}
    resultY  =>  {status: 'rejected', reason: "blah blah blah"}
    */

    if(isFulfilled(resultR)){ //typeguard working for destructured resultR but not for array result - needs investigating
        if (resultR.value.Attributes){
            return <Game><unknown>resultR.value.Attributes
        }
    }
    
    if (isFulfilled(resultY)){ //typeguard working for destructured resultR but not for array result - needs investigating
        if (resultY.value.Attributes){
            return <Game><unknown>resultY.value.Attributes
        }
    }

    return undefined

    //const savedGame: PromiseFulfilledResult<UpdateItemOutput | undefined> = result.find( item => isFulfilled(item)) 


}


export async function updateClientSecret(documentClient: DocumentClient, gameTableName:string, gameId: string, newPlayer: Player, clientSecret: string): Promise<Game | undefined>{
    const params = {
        TableName: gameTableName,
        Key: { gameId : gameId },
        UpdateExpression: 'set #secret = :c',
        ExpressionAttributeNames: {'#secret' : `secretAccessToken${newPlayer.toUpperCase()}`},
        ExpressionAttributeValues: {
          ':c' : clientSecret
        },
        ReturnValues: 'ALL_NEW'
    }

    console.log(`updateClientSecret (request): ${JSON.stringify(params)}`)

    const savedGame = await documentClient.update(params).promise();
    console.log(`updateClientSecret (result): ${JSON.stringify(savedGame)}`)

    if (savedGame.Attributes){
        return <Game>savedGame.Attributes
    }
    else{
        return undefined // what is the error happening here? Add better handling/logging here - should give as much detail as possible
    }

}

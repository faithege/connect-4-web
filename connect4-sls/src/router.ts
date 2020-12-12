import * as serverless from 'serverless-http'
import * as express from 'express'
import { CustomResponse, getGame, postNewGame } from './app'
import { Request, Response } from 'express';
import { DynamoDB } from 'aws-sdk';



const app = express()
const documentClient = new DynamoDB.DocumentClient();
const gameTableName = process.env.DYNAMODB_TABLE;


function responseToExpress(nodeResponse: Response, response: CustomResponse){
    nodeResponse.status(response.statusCode).json(response.body)
}

function adapter(fn:(req: Request, tableName: string) => Promise<CustomResponse>) {
    return async function (req: Request, res: Response) {
        if (!gameTableName) {
            console.error('ENV VAR DYNAMODB_TABLE has not been defined')
            res.status(500).json('There\'s an internal configuration error')
        } else {
            try {
                const response = await fn(req, gameTableName) //output a string never undefined at this point
                responseToExpress(res, response)
            }
            catch (error) {
                console.error('error:', error);
                return res.status(503).json(error)
              }
        }
    }
}

app.post('/new', adapter(async function(req, tableName){
    return await postNewGame(documentClient, tableName)
})
)

app.get('/game/:gameId', adapter(async function(req, tableName){
    const gameId: string = req.params.gameId
    return await getGame(documentClient, tableName, gameId)
})
)
    

// app.post('/new', async function (req, res) {
//     if (!tableName) {
//         console.error('ENV VAR DYNAMODB_TABLE has not been defined')
//         res.status(500).json('There\'s an internal configuration error')
//     } else {
//         const response = await postNewGame(documentClient, tableName)
//         responseToExpress(res, response)
//     }
    
// })

// app.get('/game/:gameId', async function (req, res) {
//     if (!gameTableName) {
//         console.error('ENV VAR DYNAMODB_TABLE has not been defined')
//         res.status(500).json('There\'s an internal configuration error')
//     } else {
//         const gameId: string = req.params.gameId
//         const response = await getGame(documentClient, gameTableName, gameId)
//         responseToExpress(res, response)
//     }
// })  
export const handler = serverless(app)

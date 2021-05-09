import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Connection } from "../model";

export async function updateConnection(documentClient: DocumentClient, connectionsTableName:string, gameId: string, connectionId: string): Promise<Connection | undefined>{
    const params = {
        TableName: connectionsTableName,
        Key: { connectionId : connectionId },
        UpdateExpression: 'set gameId = :g',
        ExpressionAttributeValues: {
          ':g' : gameId
        },
        ReturnValues: 'ALL_NEW'
    }

    console.log(`updateConnection: ${JSON.stringify(params)}`)

    const savedConnection = await documentClient.update(params).promise();
    console.log(`${JSON.stringify(savedConnection)}`)

    if (savedConnection.Attributes){
        return <Connection>savedConnection.Attributes
    }
    else{
        return undefined 
    }

}

export async function getConnectionFromDatabase(documentClient: DocumentClient, connectionTableName:string, id: string): Promise<Connection | undefined>{
    const params: DocumentClient.GetItemInput = {
        TableName : connectionTableName,
        Key: {
            connectionId: id
        }
    }

    const response = await documentClient.get(params).promise()

    // Handle the case where an incorrect id is passed in (returns {} and so cannot be cast to a Connection type)
    if(response.Item){
        // cast to a Connection
        return <Connection>response.Item
    }
    else{
        return undefined
    }

}
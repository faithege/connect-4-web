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

    console.log(JSON.stringify(params))

    const savedConnection = await documentClient.update(params).promise();
    console.log(`${JSON.stringify(savedConnection)}`)

    if (savedConnection.Attributes){
        return <Connection>savedConnection.Attributes
    }
    else{
        return undefined 
    }

}
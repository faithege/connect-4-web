import type { Event, Serverless } from 'serverless/aws';

function httpEvent(path: string, method: string): Event {
  return {
    http: {
      path,
      method
    }
  }
}

const serverlessConfiguration: Serverless = {
  service: 'connect4',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true
    },
    client: {
      bucketName: 'connect-4-web-faith-ege',
      distributionFolder: '../vue-frontend/dist',
      errorDocument: 'index.html'
    }
  },
  // Add the serverless-webpack plugin
  plugins: ['serverless-webpack', 'serverless-finch'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: { // env vars
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      DYNAMODB_TABLE: '${self:service}-${opt:stage, self:provider.stage}', //can't use references like you can with CFN
      DYNAMODB_CONNECTIONS_TABLE: '${self:service}-connections-${opt:stage, self:provider.stage}'
    },
    region: 'eu-west-1',
    iamRoleStatements: [{ //permissions
      Effect: 'Allow',
      Action: [
        'dynamodb:Query',
        'dynamodb:Scan',
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
      ],
      Resource: [
        "arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/${self:provider.environment.DYNAMODB_TABLE}",
        "arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/${self:provider.environment.DYNAMODB_CONNECTIONS_TABLE}"
      ]
    },{
      Effect: 'Allow',
      Action: [
        's3:*'
      ],
      Resource: "arn:aws:s3:::connect-4-web-faith-ege*"
    }]
  },
  functions: {
    handler: {
      handler: 'index.app', //where our handler sits
      events: [
        httpEvent('/', 'ANY'),
        httpEvent('{proxy+}', 'ANY')
        // httpEvent('/new', 'post'), //events hooked up via api gateway - httpEvent is defined at the top of this file (path then method)
        // httpEvent('/game/{gameId}', 'get'),
        // httpEvent('/game', 'put'),
      ]
    },
    connectionHandler:{
    handler: 'index.connectionHandler',
    events: [
      {
        websocket:{
          route: '$connect'
        }
      },
      {
        websocket:{
          route: '$disconnect'
        }
      },
      {
        websocket:{
          route: '$default'
        }
      }
    ]
    }
  },
  resources: {
    Resources: {
      userTable: { //gameTable would be a better name not sure if changing now would cause an issue?
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.DYNAMODB_TABLE}',
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          },
          AttributeDefinitions: [{ 
            AttributeName: 'gameId',
            AttributeType: 'S'
          }],
          KeySchema: [
            { AttributeName: 'gameId', // We are hashing the data to give it a more even distribution
              KeyType: 'HASH' 
            }
          ]
        }
      },
      connectionsTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.DYNAMODB_CONNECTIONS_TABLE}',
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          },
          AttributeDefinitions: [{ 
            AttributeName: 'connectionId',
            AttributeType: 'S'
          }],
          KeySchema: [
            { AttributeName: 'connectionId', // We are hashing the data to give it a more even distribution
              KeyType: 'HASH' 
            }
          ]
        }
      }
    }
  }
}

module.exports = serverlessConfiguration;

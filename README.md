# connect-4-web
Taking my Connect 4 Game (initially created for playing in the Terminal) and deploying it as web application using a WebSocket.

## Serverless backend
The backend of the application uses
### API Gateway
REST API Calls are routed by a Node Express router
- POST `/new` creates and stores a new connect 4 game in the DynamoDB. 
- GET `/game/gameId` will get the specified game. 
- PUT `/game` will update the specified game.
<!-- end of the list -->
Note that the web application only makes use of the new game endpoint, as the websocket handles the retrieval and updating of the game
### WebSocket

## Vue frontend

## CI/CD

import 'source-map-support/register';
import { handler } from './src/router';
import { handler as websocketHandler} from './src/websocket';

export const app = handler;
export const connectionHandler = websocketHandler
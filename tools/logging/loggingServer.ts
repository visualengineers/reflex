import * as bodyparser from 'body-parser';
import * as express from 'express';
import * as fileUpload from 'express-fileupload';
import * as winston from 'winston';
import * as expressWinston from 'express-winston';
import * as cors from 'cors';
import debug from 'debug';
import { CommonRoutesConfig } from './common/common-routes.config';
import { DataRoutes } from './routes/data.routes.config';
import { LoggingRoutes } from './routes/logging.routes.config';


const app = express();
const port: Number = 4301;
const routes: Array<CommonRoutesConfig> = [];
const debugLog: debug.IDebugger = debug('app');

const logAllHttpRequests = false;

let name = new Date().toISOString();
name = name.replace(/[/\\?%*:|"<>]/g, '');

app.use(express.static('data'));
app.use(express.static('logs'));

// here we are adding middleware to parse all incoming requests as JSON 
app.use(bodyparser.json({limit: '200mb'}));

// here we are adding middleware to allow cross-origin requests
app.use(cors());

// enable file upload middleware
app.use(fileUpload());

// here we are configuring the expressWinston logging middleware,
// which will automatically log all HTTP requests handled by Express.js

if (logAllHttpRequests) {
    app.use(expressWinston.logger({
        transports: [
            new winston.transports.Console()
        ],
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.json()
        )
    }));
}

// here we are configuring the expressWinston error-logging middleware,
// which doesn't *handle* errors per se, but does *log* them
app.use(expressWinston.errorLogger({
  transports: [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: `data/log/${name}_error.log`
      })
  ],
  format: winston.format.combine(
      winston.format.simple()
  )
}));

app.listen(port, () => {
  const msg = `Server running at http://localhost:${port}`;
  debugLog(msg);
  routes.forEach((route: CommonRoutesConfig) => {
      debugLog(`Routes configured for ${route.getName()}`);
  });
});

routes.push(new DataRoutes(app));
routes.push(new LoggingRoutes(app));

export { app };

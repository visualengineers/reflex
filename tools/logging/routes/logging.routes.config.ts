import debug from 'debug';
import * as express from 'express';
import * as fs from 'node:fs';
import * as winston from 'winston';
import { CommonRoutesConfig } from '../common/common-routes.config';

const log: debug.IDebugger = debug('app:controller[LOGGING]');
const logDir = 'data/log';

export class LoggingRoutes extends CommonRoutesConfig {

  private logger?: winston.Logger;
  public constructor(app: express.Application) {
    super(app, 'LoggingRoutes');
  }

  public configureRoutes(): express.Application {
    this.app.route(`/log/result`)
      .get((req, res) => {
        this.getLogMessages('results', req, res);
      })
      .post((req, res) => {
        this.writeLogMessage('results', req, res);
      });

    this.app.route(`/log/data/:file`)
      .get((req, res) => {
        try {
          const file = `data/log/${req.params.file}_data.csv`;

          const fileExists = fs.existsSync(file);

          if (!fileExists) {
            res.status(404).send({ error: `File not found: ${file}` });

            return;
          }

          fs.readFile(file, 'utf8', (err, data) => {
            if (err !== null) {
              log(err);
              res.status(500).send(err);

              return;
            }
            res.status(200).send(data);
          });
        } catch (err) {
          res.status(500).send(err);
        }
      });
    this.app.route(`/log/data`)
      .post((req, res) => {
        this.writeLogMessage('sensorData', req, res);
      });

    this.app.route(`/log/create/`)
      .post((req, res) => {
        try {
          if (this.logger !== undefined) {
            this.logger.close();
            this.logger.destroy();
          }
          let name = new Date().toISOString();
          name = name.replace(/[/\\?%*:|"<>]/g, '');

          this.logger = this.createLogger(name);


          // write header for sensor data
          this.writeLogMessage('sensorData', req, res, { file: name });

        } catch (err) {
          res.status(500).send(err);
        }
      });

    return this.app;
  }

  private createLogger(name: string): winston.Logger {
    // custom logger:
    const experimentLogLevels = {
      levels: {
        sensorData: 0,
        results: 1
      },
      colors: {
        sensorData: 'green',
        results: 'blue'
      }
    };

    // Ignore log messages if they have { private: true }
    const ignoreData = winston.format((info) => {
      if (info.level !== 'results') {
        return false;
      }

      return info;
    });


    const experimentLogger = winston.loggers.add('experimentLogger', {
      levels: experimentLogLevels.levels,
      transports: [
        new winston.transports.File({
          filename: `${logDir}/${name}_data.csv`,
          level: 'sensorData',
          format: winston.format.printf(({ message }) => String(message))
        }),
        new winston.transports.File({
          filename: `${logDir}/${name}_result.json`,
          level: 'results',
          format: winston.format.combine(
            winston.format.json(),
            ignoreData()
          )
        })
      ],
      exitOnError: false
    });

    return experimentLogger;
  }


  private getLogMessages(filter: string, req: express.Request, res: express.Response): void {
    if (this.logger === undefined) {
      res.status(500).send({ error: 'Logger needs to created before starting logging.' });

      return;
    }

    try {
      this.logger.query(undefined, (err: Error, results: unknown) => {
        if (err !== null) {
          res.status(500).send(err);
        } else if (filter === 'sensorData') {
          res.send(results);
        } else if (filter === 'results') {
          res.send(JSON.stringify(results));
        } else {
          res.status(500).send({ error: `Unknown log format: ${filter}` });
        }
      });
    } catch (err) {
      res.status(500).send(err);
    }
  }

  private writeLogMessage(filter: string, req: express.Request, res: express.Response, responseBody?: unknown): void {
    if (this.logger === undefined) {
      res.status(500).send({ error: 'Logger needs to created before starting logging.' });

      return;
    }
    try {
      this.logger.log(filter, req.body);
    } catch (err) {
      res.status(500).send(err);
    }
    if (responseBody !== undefined) {
      res.status(200).send(responseBody);
    } else {
      res.status(200).send();
    }
  }

}

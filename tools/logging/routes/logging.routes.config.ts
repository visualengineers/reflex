import * as express from 'express';
import debug from 'debug';
var fs = require('fs');
import { CommonRoutesConfig } from "../common/common-routes.config";
import * as winston from 'winston';

const log: debug.IDebugger = debug('app:controller[LOGGING]');
const log_dir = 'data/log';

export class LoggingRoutes extends CommonRoutesConfig {
    constructor(app: express.Application) {
        super(app, 'LoggingRoutes');
    }

    private _logger?: winston.Logger;

    private createLogger(name: string) : winston.Logger {
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
            if (info.level !== 'results') { return false; }
            return info;
        });


        const experimentLogger = winston.loggers.add('experimentLogger', {
            levels: experimentLogLevels.levels,
            transports: [        
                new winston.transports.File({
                    filename: `${log_dir}/${name}_data.csv`,
                    level: 'sensorData',
                    format: winston.format.printf(({ level, message }) => {
                        return `${message}`;
                      })
                }),
                new winston.transports.File({
                    filename: `${log_dir}/${name}_result.json`,
                    level: 'results',
                    format: winston.format.combine(
                        winston.format.json(), 
                        ignoreData()
                    )
                }),
            ],
            exitOnError: false
        });

        return experimentLogger;
    }
    
    configureRoutes(): express.Application {
        this.app.route(`/log/result`)
        .get(async (req, res) => { 
            await this.getLogMessages('results', req, res);
        })
        .post(async (req, res) => {
            await this.writeLogMessage('results', req, res);
        });

        this.app.route(`/log/data/:file`)
        .get(async (req, res) => {
            try {
                const file = `data/log/${req.params.file}_data.csv`;

                const fileExists = fs.existsSync(file);

                if (!fileExists) {
                  res.status(404).send({error: `File not found: ${file}` });
                  return;
                }

                fs.readFile(file, 'utf8', (err:any, data:any) => {
                 if (err) {
                   log(err);
                   res.status(500).send(err);
                   return;
                 }
                 res.status(200).send(data);
               }); 
             } catch (err) {
                 res.status(500).send(err);
             }
        })
        this.app.route(`/log/data`)
        .post(async (req, res) => {
            await this.writeLogMessage('sensorData', req, res);
        });

        this.app.route(`/log/create/`)
        .post(async (req, res) => {
            try {
                if (this._logger !== undefined) {
                    this._logger.close();
                    this._logger.destroy();
                }
                let name = new Date().toISOString();
                name = name.replace(/[/\\?%*:|"<>]/g, '');

                this._logger = this.createLogger(name);



                // write header for sensor data
                await this.writeLogMessage('sensorData', req, res, { file: name })

            }  catch (err) {
                res.status(500).send(err);
            }
        });

        return this.app;
    } 


    private async getLogMessages(filter: string, req: any, res: any) {
        if (this._logger == undefined) {
            return res.status(500).send({ error: 'Logger needs to created before starting logging.' });
        }

        try {
           this._logger.query(undefined, (err:Error, results:any) => {
                if (err) {
                    res.status(500).send(err);                    
                } else if (filter === 'sensorData') {
                    res.send(results);
                } else if (filter === 'results') {
                    res.send(JSON.stringify(results));
                } else {
                    res.status(500).send({ error: `Unknown log format: ${filter}`});
                }
           })
        } catch (err) {
            res.status(500).send(err);
        }
    }

    private async writeLogMessage(filter: string, req: any, res: any, responseBody?: any) {
        if (this._logger == undefined) {
            return res.status(500).send({ error: 'Logger needs to created before starting logging.' });
        }
        try {
            this._logger.log(filter, req.body);         
         } catch (err) {
             res.status(500).send(err);
         }
         if (responseBody) {
            res.status(200).send(responseBody);
         }
         else
         {
            res.status(200).send();
         }
    }

}
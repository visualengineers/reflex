import * as express from 'express';
var fs = require('fs');
import debug from 'debug';
import { CommonRoutesConfig } from "../common/common-routes.config";

const log: debug.IDebugger = debug('app:controller[PHOTOS]');
const data_dir = 'data';

export class DataRoutes extends CommonRoutesConfig { 
    
    constructor(app: express.Application) {
        super(app, 'DataRoutes');
    }
    
    configureRoutes(): express.Application {
        this.app.route(`/data/:userId`)
            .get(async (req, res) => {
                try {
                   const file = this.getFilePath(req.params.userId);

                   const fileExists = fs.existsSync(file);

                   if (!fileExists) {
                     res.status(404).send('{"error": "File not found" }');
                     return;
                   }

                   fs.readFile(file, 'utf8', (err:any, data:any) => {
                    if (err) {
                      log(err);
                      res.status(500).send(err);
                      return;
                    }
                    res.send(data);
                  }); 
                } catch (err) {
                    res.status(500).send(err);
                }
            })
            .post(async (req, res) => {
                try {
                    if(!req.body) {
                        res.send({
                            status: false,
                            message: 'no body to save'
                        });
                    } else if (!req.params.userId){
                        res.send({
                            status: false,
                            message: 'no userId provided'
                        });
                    }                    
                    else {
                        let data = req.body;

                        if (!fs.existsSync(data_dir)) {
                            fs.mkdirSync(data_dir);
                        }

                        let file = this.getFilePath(req.params.userId);

                        fs.writeFile(file, JSON.stringify(data), (error: any) =>
                        {   
                            if (error) {
                                log(error);
                                res.status(404).send('{"error": "User not saved" }');
                                return;
                            }
                            res.send(`{"file": "${file}" }`);
                        })
                    }
                } catch (err) {
                    res.status(500).send(err);
                }
            });

            this.app.route(`/data`)
            .get(async (req, res) => {
                try {

                    let result : number[] = [];

                    if (fs.existsSync(data_dir)) {

                        fs.readdirSync(data_dir).forEach((file: { toString: () => any; }) => {

                            let name = file.toString();
                            if (name.length === 13) {
                                const id = parseInt(name.substr(5,3));
                                result.push(id);
                            }
                        });
                    }

                    const json = JSON.stringify(result)

                    res.send(json);

                } catch (err) {
                    res.status(500).send(err);
                }
            });

        return this.app;
    }

    private getFilePath(userId: string): string {

        const user = userId.padStart(3, '0');
        return `${data_dir}/data_${user}.json`;
    }
}
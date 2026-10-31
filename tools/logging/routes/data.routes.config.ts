import debug from 'debug';
import * as express from 'express';
import * as fs from 'node:fs';
import { CommonRoutesConfig } from '../common/common-routes.config';

const log: debug.IDebugger = debug('app:controller[PHOTOS]');
const dataDir = 'data';

export class DataRoutes extends CommonRoutesConfig {

  public constructor(app: express.Application) {
    super(app, 'DataRoutes');
  }

  public configureRoutes(): express.Application {
    this.app.route(`/data/:userId`)
      .get((req, res) => {
        try {
          const file = this.getFilePath(req.params.userId);

          const fileExists = fs.existsSync(file);

          if (!fileExists) {
            res.status(404).send('{"error": "File not found" }');

            return;
          }

          fs.readFile(file, 'utf8', (err, data) => {
            if (err !== null) {
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
      .post((req, res) => {
        try {
          if (req.body === undefined || req.body === null) {
            res.send({
              status: false,
              message: 'no body to save'
            });
          } else if (!req.params.userId) {
            res.send({
              status: false,
              message: 'no userId provided'
            });
          } else {
            const data: unknown = req.body;

            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir);
            }

            const file = this.getFilePath(req.params.userId);

            fs.writeFile(file, JSON.stringify(data), (error) => {
              if (error !== null) {
                log(error);
                res.status(404).send('{"error": "User not saved" }');

                return;
              }
              res.send(`{"file": "${file}" }`);
            });
          }
        } catch (err) {
          res.status(500).send(err);
        }
      });

    this.app.route(`/data`)
      .get((req, res) => {
        try {

          const result: Array<number> = [];

          if (fs.existsSync(dataDir)) {

            fs.readdirSync(dataDir).forEach((file) => {

              const name = file.toString();
              if (name.length === 13) {
                const id = parseInt(name.substr(5, 3));
                result.push(id);
              }
            });
          }

          const json = JSON.stringify(result);

          res.send(json);

        } catch (err) {
          res.status(500).send(err);
        }
      });

    return this.app;
  }

  private getFilePath(userId: string): string {

    const user = userId.padStart(3, '0');

    return `${dataDir}/data_${user}.json`;
  }
}

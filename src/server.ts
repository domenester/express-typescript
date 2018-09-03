import * as dotenv from "dotenv";
import * as express from "express";
import {ErrorRequestHandler} from "express-serve-static-core";
import * as http from "http";
import * as path from "path";
import * as winston from "winston";
import EndpointsApi from "./services/endpoint/index";
import {errorGenerator, errorHandler} from "./services/error/error";
import {default as Logger} from "./services/logger/logger";

const env = process.env;
dotenv.config({ path: path.join(__dirname, "../.env")});

class Server {

    public app: express.Application;

    private server: http.Server;

    private port: number = +env.NODE_PORT || 3000;

    private host: string = env.NODE_HOST;

    private logger: winston.Logger;

    private errorHandler: ErrorRequestHandler;

    constructor() {
        this.app = express();
        this.logger = Logger();
        this.errorHandler = errorHandler(this.logger);
    }

    public async start(): Promise<void> {
      try {
        await this.middlewares();
        await this.exposeEndpoints();
        this.server = this.app.listen(this.port, this.host, () => {
          this.logger.info(`Listening to: http://${this.host}:${this.port}`);
        });
      } catch (err) {
        this.logger.error(err);
        return err;
      }
    }

    public stop(): void {
      this.server.close();
    }

    private middlewares(): Promise<any> {
      const middlewares = [
        // middlewares go here
      ];

      if (process.env.NODE_ENV === "development") {
        middlewares.push(this.errorHandler);
      }

      if (middlewares.length > 0) {
        return Promise.resolve( this.app.use(middlewares) );
      }
    }

    private exposeEndpoints(): Promise<{}> {
      if (!EndpointsApi) {
        throw errorGenerator("No endpoint found to expose", 500, "");
      }
      return new Promise((resolve) => {
        EndpointsApi.map((endpointApiClass) => {
          const endpointApi = new endpointApiClass(this.logger);
          endpointApi.endpoints.map((endpoint) => {
            const endpointPath = `${endpointApi.path}${endpoint.path}`;
            this.app[endpoint.method](endpointPath, async (req, res) => {
              try {
                if ( (endpoint.method === "post" || endpoint.method === "put") && !req.body) {
                  // tslint:disable-next-line:max-line-length
                  const message = `Requisição sem corpo para método ${endpoint.method.toUpperCase()} no endereço ${endpointPath}`;
                  this.logger.error(message);
                  return res.status(400).json(message);
                }
                const result = await endpoint.handler({
                  body: req.body,
                  headers: req.headers,
                  parameters: req.params,
                });
                return res.json(result);
              } catch (err) {
                return res.json(err.code).send(err);
              }
            });
          });
        });
        return resolve();
      });
    }
}

export default new Server();


import {Request} from "express-serve-static-core";
import * as winston from "winston";
import {IEndpoint, IEndpointAPI} from "../../endpoint/endpoint.interface";
import LogAccessInsert from "./endpoints/log-access-insert";

class LogApi implements IEndpointAPI {
  public path = "/log-access";
  public endpoints: Array<IEndpoint<Request, any>>;
  private logger: winston.Logger;
  constructor(logger: winston.Logger) {
    this.logger = logger;
    this.endpoints = [
      new LogAccessInsert(this.logger),
    ];
  }
}

export default LogApi;

import "fastify";
import { Server } from "socket.io";
import type { Config } from "../app/configSchema";
import Redis from "ioredis";
import { Sequelize } from "sequelize";
import { JWT } from "@fastify/jwt";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: any; // você pode deixar `any` ou tipar melhor se quiser
    io: Server;
    config: Config;
    redis: Redis;
    sequelize: Sequelize;
    jwt: JWT;
  }
}

declare module "fastify" {
  interface FastifyRequest {
    user?: { id: string; email: string };
    moduleName: any;
  }
}

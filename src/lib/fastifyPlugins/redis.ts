import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { registerBullMQ } from "../../app/bull";
import { redisClient } from "../redis";
import { logger } from "../../utils/logger";

export const redisPlugin = fp(async (fastify: FastifyInstance) => {
  
    redisClient.on("ready",()=>{
         logger.info("✅ Redis conectado e pronto");
         fastify.register(registerBullMQ);
        //  fastify.register(async (fastify) => { registerBullMQ(fastify)})
            
    })
    fastify.decorate("redis", redisClient);
});

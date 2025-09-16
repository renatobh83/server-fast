import { FastifyInstance } from "fastify";
import * as AdminController from "../controller/AdminController";

export default async function adminRoutes(fastify: FastifyInstance) {
  fastify.get("/list-settings", AdminController.listSettings);
  fastify.get("/list-chatflow", AdminController.ListChatFlow);
  fastify.get("/list-users", AdminController.listUsers);
}

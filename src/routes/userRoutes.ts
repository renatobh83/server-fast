import type { FastifyInstance } from "fastify";
import * as UserController from "../controller/UserController";
// Rotas de usuários
async function userRoutes(fastify: FastifyInstance, done: () => void) {
  fastify.get("/", UserController.listUserController);
  fastify.post(
    "/",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password", "name"],
          properties: {
            email: { type: "string" },
            password: { type: "string" },
            name: { type: "string" },
            profile: { type: "string" },
            queues: { type: "array", items: { type: "object" } },
          },
        },
      },
    },
    UserController.createUser
  );
  fastify.put(
    "/:userId",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "name"],
          properties: {
            email: { type: "string" },
            password: { type: "string" },
            name: { type: "string" },
            profile: { type: "string" },
            queues: { type: "array", items: { type: "object" } },
            ativo: { type: "boolean" },
          },
        },
      },
    },
    UserController.update
  );
  fastify.delete("/:userId", UserController.removeUser);
  fastify.put(
    "/usersIsOnline/:userId",
    {
      schema: {
        body: {
          type: "object",
          required: ["isOnline"],
          properties: {
            isOnline: { type: "boolean" },
            status: { type: "string" },
          },
        },
      },
    },
    UserController.updateIsOnline
  );
  fastify.get("/users/:userId", UserController.showUser);
  done();
}

export default userRoutes;

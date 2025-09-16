import type { FastifyInstance } from "fastify";
import * as UserController from "../controller/UserController";
// Rotas de usuários
async function userRoutes(fastify: FastifyInstance) {
  fastify.get("/", UserController.listUserController);

  fastify.get("/:id", async (request) => {
    const { id }: any = request.params;
    return { id, name: `Usuário ${id}` };
  });
}

export default userRoutes;

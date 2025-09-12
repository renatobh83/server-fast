import type { FastifyInstance } from "fastify";

// Rotas de usuários
async function userRoutes(fastify: FastifyInstance) {
  fastify.get("/", async () => {
    const token = fastify.jwt.sign({ user: "username" });
    console.log(token);
    return { token };

    // return [
    //   { id: 1, name: "Alice" },
    //   { id: 2, name: "Bob" },
    // ];
  });

  fastify.get("/:id", async (request) => {
    const { id }: any = request.params;
    return { id, name: `Usuário ${id}` };
  });
}

export default userRoutes;

import type { FastifyInstance } from "fastify";

// Rotas de servidores
async function serverRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [fastify.authenticate] }, async () => {
    return [
      { id: 1, host: "192.168.0.1" },
      { id: 2, host: "192.168.0.2" },
    ];
  });

  fastify.post(
    "/:id",
    {
      schema: {
        body: {
          type: "object",
        },
      },
    },
    async (request) => {
      const { id }: any = request.params;
      return { id, host: `Servidor ${id}` };
    }
  );
}

export default serverRoutes;

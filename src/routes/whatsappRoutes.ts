import { FastifyInstance } from "fastify";
import * as WhatsappController from "../controller/WhatsappController";
export async function whastappRoutes(fastify: FastifyInstance) {
  // rota criar canal
  fastify.post(
    "/whatsapp",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "type"],
          properties: {
            name: { type: "string" },
            type: { type: "string" },
            tokenTelegram: { type: "string" },
            instagramUser: { type: "string" },
            instagramKey: { type: "string" },
            wabaBSP: { type: "string" },
            tokenAPI: { type: "string" },
            farewellMessage: { type: "string" },
          },
        },
      },
    },
    WhatsappController.createCanal
  );

  fastify.get("/whatsapp", WhatsappController.listaCanais);
  fastify.get("/whatsapp/:whatsappId", WhatsappController.detalhesCanal);
  fastify.delete("/whatsapp/:whatsappId", WhatsappController.deletarCanal);
  fastify.put(
    "/whatsapp/:whatsappId",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "type"],
          properties: {
            name: { type: "string" },
            type: { type: "string" },
            tokenTelegram: { type: "string" },
            instagramUser: { type: "string" },
            instagramKey: { type: "string" },
            wabaBSP: { type: "string" },
            tokenAPI: { type: "string" },
            status: { type: "string" },
            isDefault: { type: "boolean" },
            wppUser: { type: "string" },
            chatFlowId: { type: "number" },
            qrcode: { type: "string" },
            pairingCodeEnabled: { type: "boolean" },
            farewellMessage: { type: "string" },
          },
        },
      },
    },
    WhatsappController.updateCanal
  );
}

import { FastifyInstance } from "fastify";
import * as SessionController from "../controller/SessionController";

export default async function authRoutes(
  fastify: FastifyInstance,
  done: () => void
) {
  fastify.post(
    "/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
          },
        },
      },
    },
    SessionController.StoreLoginHandler
  );
  fastify.post(
    "/logout",
    {
      schema: {
        body: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    SessionController.LogoutUser
  );
  fastify.post(
    "/forgot-password",
    {
      schema: {
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    SessionController.forgotPassword
  );
  fastify.post("/valid_token", SessionController.validaToken);
  fastify.post("/refresh_token", SessionController.refreshToken);
  done();
}

import { FastifyInstance } from "fastify";
import * as SessionController from "../controller/SessionController";

export default async function authRoutes(fastify: FastifyInstance) {
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
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
              data: { type: "object", additionalProperties: true },
              token: { type: "string" },
            },
          },
        },
      },
    },
    SessionController.StoreLoginHandler
  );
  fastify.post("/logout", SessionController.LogoutUser);
  fastify.post("/forgot-password",{
      schema: {
        body: {
          type: "object",
          required: "email",
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
    }, SessionController.forgotPassword);
}

import { FastifyInstance } from "fastify";
import * as SettingController from "../controller/SettingController";

export default async function settginsRoutes(fastify: FastifyInstance) {
  fastify.get("/settings", SettingController.listSettings);
  fastify.put("/settings/:settingKey", SettingController.updateSettings);
}

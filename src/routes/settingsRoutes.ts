import { FastifyInstance } from "fastify";
import * as SettingController from "../controller/SettingController";

export default async function settginsRoutes(
  fastify: FastifyInstance,
  done: () => void
) {
  fastify.get("/", SettingController.listSettings);
  fastify.put("/:settingKey", SettingController.updateSettings);
  done();
}

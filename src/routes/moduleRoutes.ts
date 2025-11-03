import {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyPluginOptions,
} from "fastify";
import { getAllModules, updateModuleStatus } from "../services/ModuleServices";

import userRoutes from "./userRoutes";
import messageRoutes from "./messageRoutes";
import authRoutes from "./authRoutes";
import chatRoutes from "./chatClientRoutes";
import apiExternaRoutes from "./apiExternaRoutes";
import aplicationRoutes from "./aplicationRoutes";
import tenantRoutes from "./tenantRoutes";
import adminRoutes from "./adminRoutes";
import apiConfiRoutes from "./apiConfigRoutes";
import chamadoRoutes from "./chamadosRoutes";
import contactRoutes from "./contactRoutes";
import empresaRoutes from "./empresaRoutes";
import fastReplyRoutes from "./fastReplyRoutes";
import settginsRoutes from "./settingsRoutes";
import emailRoutes from "./emilRoutes";
import queueRoutes from "./queuRoutes";
import { whastappRoutes } from "./whatsappRoutes";
import ticketRoutes from "./ticketRoutes";
import statisticsRoutes from "./statisticsRoutes";
import integtracaoRoutes from "./integracaoRoutes";
import notaFiscalRoutes from "./notafiscalRoutes";
import chatFlowRoutes from "./ChatFlowRoutes";
import auxiliarRoutes from "./auxiliarRoutes";

// Definição de tipo para o módulo
interface Module {
  name: string;
  is_active: boolean;
}
interface ModuleOptions {
  isPrivate?: boolean;
}
/**
 * Função auxiliar para criar um plugin de rota de módulo.
 * Adiciona um decorador 'moduleName' à instância do Fastify para que o middleware
 * possa identificar a qual módulo a rota pertence.
 * @param name O nome do módulo.
 * @param routes A função que registra as rotas específicas do módulo.
 */
const createModulePlugin = (
  name: string,
  routes: (fastify: FastifyInstance, done: () => void) => void,
  options: ModuleOptions = {}
): FastifyPluginCallback => {
  const plugin: FastifyPluginCallback = (
    fastify,
    _opts: FastifyPluginOptions,
    done
  ) => {
    fastify.decorateRequest("moduleName", name);
    routes(fastify, done);
  };

  // metadados
  (plugin as any).moduleName = name;
  (plugin as any).isPrivate = options.isPrivate ?? false;

  return plugin;
};

/**
 * Rotas de exemplo para os módulos 'users', 'products' e 'orders'.
 * Estas rotas só serão registradas se o módulo correspondente estiver ativo.
 * @param fastify Instância do Fastify.
 * @param options Opções do plugin.
 */
export const moduleRoutes = {
  api: createModulePlugin("api", chatRoutes, { isPrivate: false }),
  auth: createModulePlugin("auth", authRoutes, { isPrivate: false }),
  v1: createModulePlugin("v1", apiExternaRoutes, { isPrivate: false }),
  aux: createModulePlugin("aux", auxiliarRoutes, { isPrivate: false }),
  // Rotas Privadas
  loadInicial: createModulePlugin("loadInicial", aplicationRoutes, {
    isPrivate: true,
  }),
  tenants: createModulePlugin("tenants", tenantRoutes, { isPrivate: true }),
  admin: createModulePlugin("admin", adminRoutes, { isPrivate: true }),
  users: createModulePlugin("users", userRoutes, { isPrivate: true }),
  messages: createModulePlugin("messages", messageRoutes, { isPrivate: true }),
  apiConfig: createModulePlugin("apiConfig", apiConfiRoutes, {
    isPrivate: true,
  }),
  chamados: createModulePlugin("chamados", chamadoRoutes, { isPrivate: true }),
  contacts: createModulePlugin("contacts", contactRoutes, { isPrivate: true }),
  empresas: createModulePlugin("empresas", empresaRoutes, { isPrivate: true }),
  fastreply: createModulePlugin("fastreply", fastReplyRoutes, {
    isPrivate: true,
  }),
  settings: createModulePlugin("settings", settginsRoutes, { isPrivate: true }),
  email: createModulePlugin("email", emailRoutes, { isPrivate: true }),
  queue: createModulePlugin("queue", queueRoutes, { isPrivate: true }),
  whatsapp: createModulePlugin("whatsapp", whastappRoutes, { isPrivate: true }),
  tickets: createModulePlugin("tickets", ticketRoutes, { isPrivate: true }),
  statistics: createModulePlugin("statistics", statisticsRoutes, {
    isPrivate: true,
  }),
  integracoes: createModulePlugin("integracoes", integtracaoRoutes, {
    isPrivate: true,
  }),
  notaFiscal: createModulePlugin("notaFiscal", notaFiscalRoutes, {
    isPrivate: true,
  }),
  whatsappsession: createModulePlugin("whatsappsession", whastappRoutes, {
    isPrivate: true,
  }),
  chatFlow: createModulePlugin("chatFlow", chatFlowRoutes, {
    isPrivate: true,
  }),
};

/**
 * Rota de controle para listar e alterar o status dos módulos.
 * Esta rota deve estar sempre ativa.
 * @param fastify Instância do Fastify.
 * @param options Opções do plugin.
 */
export function controlRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
  done: () => void
) {
  // Rota para listar todos os módulos e seus status
  fastify.get("/modules", async (request, reply) => {
    const modules = await getAllModules();
    return modules;
  });

  // Rota para ativar/desativar um módulo
  fastify.post<{ Body: { name: string; is_active: boolean } }>(
    "/modules/status",
    async (request, reply) => {
      const { name, is_active } = request.body;

      if (!name || typeof is_active !== "boolean") {
        return reply.status(400).send({
          error: "Nome do módulo e status (is_active) são obrigatórios.",
        });
      }

      const affectedRows = await updateModuleStatus(name, is_active);

      if (affectedRows && affectedRows > 0) {
        // Nota: Em um ambiente de produção, seria necessário reiniciar ou recarregar
        // as rotas do Fastify para que a mudança tenha efeito imediato.
        // Para este exemplo, vamos apenas retornar o sucesso.
        return {
          message: `Módulo '${name}' ${
            is_active ? "ativado" : "desativado"
          } com sucesso.`,
          reload_needed: true,
        };
      } else {
        return reply
          .status(404)
          .send({ error: `Módulo '${name}' não encontrado.` });
      }
    }
  );

  done();
}

export const routes = async (fastify: FastifyInstance) => {
  const publicModules = Object.entries(moduleRoutes).filter(
    ([, plugin]: any) => !plugin.isPrivate
  );
  const privateModules = Object.entries(moduleRoutes).filter(
    ([, plugin]: any) => plugin.isPrivate
  );
  // públicos
  for (const [moduleName, plugin] of publicModules) {
    fastify.register(plugin, { prefix: `/${moduleName}` });
  }
  // privados
  fastify.register(async (privateScope) => {
    privateScope.addHook("preHandler", fastify.authenticate);
    for (const [moduleName, plugin] of privateModules) {
      privateScope.register(plugin, { prefix: `/${moduleName}` });
    }
  });
};

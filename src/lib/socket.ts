// src/socket.ts
import { verify } from "jsonwebtoken";
import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http"; // Importa o tipo do servidor HTTP
import { JsonWebTokenError } from "jsonwebtoken";
import User from "../models/User";
import { HandleMessageChatClient } from "../services/ChatClientService/HandleMessageChatClient";
import decodeTokenSocket from "../utils/decodeTokenSocket";

// 1. Declare a variável `io` no escopo do módulo.
//    Ela começará como `null` e será inicializada depois.
let io: SocketIOServer | null = null;

// 2. Crie a função de inicialização.
//    Ela recebe o servidor HTTP do Fastify e cria a instância do Socket.IO.
export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "*"],
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 180000,
    pingInterval: 60000,
  });
  // Middleware de autenticação
  io.use(async (socket, next) => {
    try {
      const token =
        socket?.handshake?.auth?.token ||
        socket?.handshake?.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("token ausente"));
      }

      const verifyValid = decodeTokenSocket(token);
      if (!verifyValid.isValid) return next(new Error("invalid token"));
      const data = verifyValid.data;

      // Se for chat-client
      if (data.type === "chat-client") {
        socket.handshake.auth = {
          ...data,
          tenantId: String(verifyValid.data.tenantId),
        };

        return next();
      }

      const auth = socket?.handshake?.auth;
      socket.handshake.auth = {
        ...auth,
        ...verifyValid.data,
        id: String(verifyValid.data.id),
        tenantId: String(verifyValid.data.tenantId),
      };
      const user = await User.findByPk(verifyValid.data.id, {
        attributes: [
          "id",
          "tenantId",
          "name",
          "email",
          "profile",
          "status",
          "lastLogin",
          "lastOnline",
        ],
      });

      socket.handshake.auth.user = user;

      return next();
    } catch (err) {
      if (err instanceof JsonWebTokenError) {
        console.warn(`Token inválido no socket ${socket.id}: ${err.message}`);
      } else {
        console.error(`Erro inesperado no socket ${socket.id}:`, err);
      }
      socket.emit(`tokenInvalid:${socket.id}`);
      next(new Error("authentication error"));
    }
  });

  // Retorna a instância para que o arquivo principal possa usá-la se precisar
  return io;
};

// 3. Crie a função "getter".
//    Qualquer parte do seu código chamará esta função para obter a instância do `io`.
export const getIO = (): SocketIOServer => {
  if (!io) {
    // Lança um erro se tentarem usar o `io` antes de ser inicializado.
    // Isso ajuda a pegar bugs de ordem de inicialização.
    throw new Error(
      "Socket.IO não foi inicializado! Chame initSocket primeiro."
    );
  }
  return io;
};

// Você pode manter sua lógica de conexão aqui também
export const setupSocketListeners = (): void => {
  const ioInstance = getIO(); // Pega a instância já criada

  ioInstance.on("connection", async (socket) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      const { tenantId, type } = socket.handshake.auth;
      if (type) {
        await HandleMessageChatClient(socket);
        return;
      }

      if (!token) {
        console.warn(`Socket ${socket.id} tentou conectar sem token`);
        socket.disconnect(true);
        return;
      }

      
      if (tenantId) {
        socket.join(tenantId.toString());
        console.log(
          `Cliente ${socket.id} entrou na sala do tenant ${tenantId}`
        );
      }
    } catch (err) {
      if (err instanceof JsonWebTokenError) {
        console.warn(
          `Socket ${socket.id} forneceu token inválido: ${err.message}`
        );
      } else {
        console.error(`Erro inesperado no socket ${socket.id}:`, err);
      }
      socket.disconnect(true); // garante que não fique conectado
    }

    socket.on("disconnect", (reason) => {
      console.log(`Cliente desconectado: ${socket.id}, Motivo: ${reason}`);
    });
  });
};

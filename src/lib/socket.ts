// src/socket.ts
import { verify } from "jsonwebtoken";
import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http"; // Importa o tipo do servidor HTTP
import { JsonWebTokenError } from "jsonwebtoken";

// 1. Declare a variável `io` no escopo do módulo.
//    Ela começará como `null` e será inicializada depois.
let io: SocketIOServer | null = null;

// 2. Crie a função de inicialização.
//    Ela recebe o servidor HTTP do Fastify e cria a instância do Socket.IO.
export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: ["http://localhost:5173"],
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 180000,
    pingInterval: 60000,
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

  ioInstance.on("connection", (socket) => {
    const decode = verify(
      socket.handshake.auth.token,
      process.env.JWT_SECRET!
    ) as any;

    if (decode && decode.tenantId) {
      socket.join(decode.tenantId.toString());
      console.log(
        `Cliente ${socket.id} entrou na sala do tenant ${decode.tenantId}`
      );
    }

    socket.on("disconnect", (reason) => {
      console.log(`Cliente desconectado: ${socket.id}, Motivo: ${reason}`);
    });
  });
};

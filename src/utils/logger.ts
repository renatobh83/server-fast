import winston from "winston";

// 1. Definir o formato de log JSON para sistemas (sem prettyPrint)
const jsonLogFileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json() // Usar winston.format.json() para logs processáveis por máquinas
);

// 2. Simplificar a lógica de ambiente e nível
const env = process.env.NODE_ENV || "production";
const level = env === "development" ? "debug" : "info";

// Configuração base dos transports
// Tipagem explícita para resolver o erro de TypeScript
const transports: winston.transport[] = [
  // Transport para Console
  new winston.transports.Console({
    level: level, // Usar o nível definido para o ambiente
    // 3. Usar um formato de console mais limpo e padronizado
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple() // winston.format.simple() é mais limpo que o printf customizado
    ),
  }),
];

// Adicionar transportes de arquivo apenas se não estiver em desenvolvimento (ou se o nível for 'info' ou superior)
if (level !== "debug") {
  transports.push(
    // Transport para Arquivo de Erros
    new winston.transports.File({
      filename: "./logs/error.log", // Usar um arquivo dedicado para erros
      level: "error",
      format: jsonLogFileFormat, // Usar o formato JSON para logs de arquivo
      handleExceptions: true,
      maxsize: 10485760,
      maxFiles: 10,
    }),
    // Transport para Arquivo Geral
    new winston.transports.File({
      filename: "./logs/combined.log", // Arquivo para logs gerais (info e acima)
      level: level,
      format: jsonLogFileFormat,
      maxsize: 10485760,
      maxFiles: 10,
    })
  );
}

// Criar o logger
const logger = winston.createLogger({
  level: level,
  // O formato padrão do logger é o JSON para logs de arquivo
  format: jsonLogFileFormat,
  transports: transports,
  exitOnError: false, // Não sair em exceções não tratadas
});
logger.error;
export { logger };

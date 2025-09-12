// configSchema.ts
export const configSchema = {
  type: "object",
  required: ["IO_REDIS_SERVER"],
  properties: {
    IO_REDIS_SERVER: { type: "string" },
    IO_REDIS_PORT: { type: "string", default: "6379" },
    IO_REDIS_DB_SESSION: { type: "string", default: "3" },
    IO_REDIS_PASSWORD: { type: "string" },
    DB_DIALECT: { type: "string" },
    DB_PORT: { type: "number" },
    POSTGRES_HOST: { type: "string" },
    POSTGRES_USER: { type: "string" },
    POSTGRES_PASSWORD: { type: "string" },
    POSTGRES_DB: { type: "string" },
  },
} as const;

export type Config = {
  IO_REDIS_SERVER: string;
  IO_REDIS_PORT: string;
  IO_REDIS_DB_SESSION: string;
  IO_REDIS_PASSWORD?: string;
  DB_DIALECT: string;
  DB_PORT: number;
  POSTGRES_HOST: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB: string;
};

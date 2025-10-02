import fp from "fastify-plugin";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import csrf from "@fastify/csrf-protection";
import compress from "@fastify/compress";
import formbody from "@fastify/formbody";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";

import path from "node:path";
import xss from "xss";

const fastifyModule = fp(async (fastify) => {
  fastify.log.info("🔐 Loading production Fastify module...");

  // 1️⃣ Helmet + CSP
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  });

  // 2️⃣ CORS
  const allowedOrigins = [
    "http://127.0.0.1:5500",
    "http://localhost:5173",
    "https://web.panelapps.site",
    "https://renatobh83.github.io",
  ];

  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(null, false); // simplesmente bloqueia sem throw
      }
    },
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "x-csrf-token",
    ],

    exposedHeaders: ["Content-Length", "Content-Type"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  });

  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, "..", "..", "..", "public"),
    prefix: "/public/",
  });
  // 3️⃣ Redis para rate limit
  await fastify.register(rateLimit, {
    max: 1000,
    timeWindow: "1 minute",
    redis: fastify.redis,
    errorResponseBuilder: (req, context) => ({
      code: 429,
      error: "Too Many Requests",
      message:
        "Muitas requisições feitas deste IP. Tente novamente mais tarde.",
    }),
  });

  // 4️⃣ Cookies
  await fastify.register(cookie, {
    secret: process.env.COOKIE_SECRET || "super-secret",
  });
  // 5️⃣ Body parsing
  await fastify.register(formbody);
  await fastify.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });
  await fastify.register(compress);

  // 6️⃣ Limite de payload
  fastify.addHook("onRequest", async (req, reply) => {
    const length = req.headers["content-length"];
    if (length && parseInt(length) > 50 * 1024 * 1024) {
      reply.code(413).send({ error: "Payload too large" });
    }
  });

  // 7️⃣ HPP
  fastify.addHook("preValidation", async (req, reply) => {
    if (typeof req.query === "object" && req.query !== null) {
      const query = req.query as Record<string, unknown>;

      for (const key in query) {
        if (Array.isArray(query[key])) {
          return reply
            .code(400)
            .send({ error: "Query param duplicado detectado" });
        }
      }
    }
  });

  // 9️⃣ CSRF rotativo
  await fastify.register(csrf, {
    cookieOpts: { signed: true, httpOnly: true, sameSite: "strict" },
  });
  fastify.addHook("preHandler", async (req, reply) => {
    if (req.method === "GET")
      reply.header("x-csrf-token", reply.generateCsrf());
  });

  // 🔟 Sanitização XSS
  const sanitizeObject = (obj: any) => {
    if (!obj || typeof obj !== "object") return obj;
    for (const key in obj) {
      if (typeof obj[key] === "string") obj[key] = xss(obj[key]);
      else if (typeof obj[key] === "object")
        obj[key] = sanitizeObject(obj[key]);
    }
    return obj;
  };
  fastify.addHook("preValidation", async (req) => {
    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);
  });

  // 1️⃣1️⃣ Logs
  fastify.addHook("onRequest", async (req) =>
    fastify.log.info(`[Request] ${req.method} ${req.url}`)
  );
  fastify.addHook("onResponse", async (req, reply) =>
    fastify.log.info(
      `[Response] ${req.method} ${req.url} → ${reply.statusCode}`
    )
  );

  fastify.log.info("✅ Production Fastify module loaded!");
});

export default fastifyModule;

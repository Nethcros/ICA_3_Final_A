import winston from "winston";

const logger = winston.createLogger({
  level: process.env["LOG_LEVEL"] ?? "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env["NODE_ENV"] === "production"
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf((info) => {
            // info["timestamp"] and info["stack"] come from Winston's index
            // signature ([key: string]: any). Assign to unknown first — the
            // one safe escape from any that strict ESLint explicitly allows.
            const ts: unknown = info["timestamp"];
            const stack: unknown = info["stack"];
            const timestamp = typeof ts === "string" ? ts : "";
            const stackMsg = typeof stack === "string" ? stack : undefined;
            return `${timestamp} [${info.level}]: ${stackMsg ?? info.message}`;
          }),
        ),
  ),
  transports: [new winston.transports.Console()],
});

export default logger;

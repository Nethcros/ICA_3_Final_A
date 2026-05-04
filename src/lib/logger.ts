import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === "production"
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf((info) => {
            const ts: unknown = info.timestamp;
            const stack: unknown = info.stack;
            const message: unknown = info.message;
            const timestamp = typeof ts === "string" ? ts : "";
            const stackMsg = typeof stack === "string" ? stack : undefined;
            const msgStr = typeof message === "string" ? message : "";
            return `${timestamp} [${info.level}]: ${stackMsg ?? msgStr}`;
          }),
        ),
  ),
  transports: [new winston.transports.Console()],
});

export default logger;

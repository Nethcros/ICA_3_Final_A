import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import logger from "../lib/logger.js";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

// Express types err as `any` in ErrorRequestHandler. We immediately widen to
// `unknown` so the rest of the function is fully type-safe without any `any`.
export const errorHandler: ErrorRequestHandler = (
  err,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const error: unknown = err;

  if (error instanceof AppError) {
    logger.warn("Client error", {
      statusCode: error.statusCode,
      message: error.message,
    });
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (error instanceof SyntaxError && "status" in error) {
    const httpError = error as SyntaxError & { status: unknown };
    if (httpError.status === 400) {
      res.status(400).json({ error: "Invalid JSON in request body" });
      return;
    }
  }

  logger.error("Unhandled error", { error });
  res.status(500).json({ error: "Internal server error" });
};

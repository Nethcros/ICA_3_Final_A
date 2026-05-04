import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler.js";
import type { UserRole } from "../types/auth.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer "))
    throw new AppError(401, "Authorization header with Bearer token required");

  const token = authHeader.slice(7);

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError(500, "Server misconfiguration: JWT_SECRET not set");

  try {
    const decoded = jwt.verify(token, secret);

    if (typeof decoded === "string")
      throw new AppError(401, "Invalid token");

    const id: unknown = decoded.id;
    const name: unknown = decoded.name;
    const role: unknown = decoded.role;

    if (typeof id !== "number" || typeof name !== "string")
      throw new AppError(401, "Invalid token payload");
    if (role !== "teacher" && role !== "student")
      throw new AppError(401, "Invalid token payload");

    req.user = { id, name, role };
    next();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, "Invalid or expired token");
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new AppError(401, "Not authenticated");
    if (!roles.includes(req.user.role))
      throw new AppError(403, "Forbidden: insufficient role");
    next();
  };
}

import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import db from "../db/index.js";
import { users } from "../db/schema/index.js";
import { AppError } from "../middleware/errorHandler.js";
import type { LoginBody, LoginResponse } from "../types/api.js";

function parseLoginBody(raw: unknown): LoginBody {
  if (typeof raw !== "object" || raw === null)
    throw new AppError(400, "Request body must be a JSON object");

  const b = raw as Record<string, unknown>;
  const email = b.email;
  const password = b.password;

  if (typeof email !== "string" || email.trim() === "")
    throw new AppError(400, "email is required");
  if (typeof password !== "string" || password === "")
    throw new AppError(400, "password is required");

  return { email: email.trim().toLowerCase(), password };
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = parseLoginBody(req.body as unknown);

  const user = await db.query.users.findFirst({
    where: eq(users.email, body.email),
  });

  // Same error for missing user and wrong password to avoid leaking registered emails
  if (!user) throw new AppError(401, "Invalid email or password");

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) throw new AppError(401, "Invalid email or password");

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError(500, "Server misconfiguration: JWT_SECRET not set");

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    secret,
    { expiresIn: "7d" },
  );

  const response: LoginResponse = {
    token,
    user: { id: user.id, name: user.name, role: user.role },
  };

  res.json(response);
}

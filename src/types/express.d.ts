import type { AuthUser } from "./auth.js";

// Augments Express's Request so req.user is available after requireAuth middleware
declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

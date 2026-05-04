export type UserRole = "teacher" | "student";

export interface AuthUser {
  id: number;
  name: string;
  role: UserRole;
}

export type UserRole = "SUPERADMIN" | "ADMIN" | "OPERADOR" | "VIEWER";

export class User {
  id!: string;
  clienteId!: string | null;
  email!: string;
  senha!: string;
  role!: UserRole;
  createdAt!: Date;
}

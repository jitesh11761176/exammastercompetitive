import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null; // ✅ added
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null; // ✅ added
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string | null;
  }
}

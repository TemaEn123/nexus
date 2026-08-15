"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { hashPassword } from "@/features/auth/password";
import { credentialsSchema } from "@/features/auth/schemas";
import { Prisma } from "@/generated/prisma/client";
import { signIn, signOut } from "@/server/auth";
import { prisma } from "@/shared/lib/db";

/**
 * Server Actions для форм. Файл с `"use server"` наверху: каждая export-функция
 * вызывается с клиента как POST, но выполняется только на сервере.
 *
 * `signIn` / `signOut` / `redirect` бросают исключение (так Next.js делает
 * редирект). Его нельзя глотать: ловим только `AuthError`, остальное пробрасываем.
 */

export async function register(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/register?error=invalid");
  }

  const { email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    redirect("/register?error=exists");
  }

  try {
    await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
      },
    });
  } catch (error) {
    // Гонка: два параллельных register на один email → unique (P2002).
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect("/register?error=exists");
    }
    throw error;
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/register?error=credentials");
    }
    throw error;
  }
}

export async function login(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid");
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=credentials");
    }
    throw error;
  }
}

/** OAuth: браузер уходит на GitHub, затем на `/api/auth/callback/github`. */
export async function loginWithGithub() {
  await signIn("github", { redirectTo: "/dashboard" });
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

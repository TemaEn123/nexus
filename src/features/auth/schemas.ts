import { z } from "zod";

/**
 * Runtime-схема для email/password.
 *
 * Auth.js передаёт поля формы в `authorize` как `unknown`. Типы провайдера
 * в TypeScript не защищают в рантайме, поэтому парсим здесь (и позже
 * в register/login actions) по одному контракту:
 * - email: сначала trim/lowercase, потом формат (пробелы при вставке не
 *   должны давать ложный invalid до нормализации)
 * - password: 8–72 символа (bcrypt молча обрезает всё длиннее 72 байт)
 */
export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8).max(72),
});

export type Credentials = z.infer<typeof credentialsSchema>;

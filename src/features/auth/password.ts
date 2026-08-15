import "server-only";

import { compare, hash, hashSync } from "bcryptjs";

/** bcryptjs по умолчанию 10; 12 — разумный баланс для учебного проекта. */
const HASH_ROUNDS = 12;

/**
 * Не принадлежит ни одному User. Нужен в `authorize`, чтобы bcrypt.compare
 * всегда шёл с cost 12: иначе «нет user / GitHub-only» отвечает быстрее,
 * чем «неверный пароль», и по времени видно, есть ли email в БД.
 */
export const TIMING_SAFE_DUMMY_HASH = hashSync(
  "__nexus_timing_dummy__",
  HASH_ROUNDS,
);

/**
 * Хеш пароля перед записью в User.passwordHash.
 * Сравнивать с этим результатом только через `verifyPassword`, не `===`.
 */
export function hashPassword(password: string) {
  return hash(password, HASH_ROUNDS);
}

/**
 * Сравнение plaintext из формы с хешем из БД.
 * `compare` сам извлекает salt из строки хеша.
 */
export function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

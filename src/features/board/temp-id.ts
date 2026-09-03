const TEMP_PREFIX = "temp-";

export function createTempId() {
  return `${TEMP_PREFIX}${crypto.randomUUID()}`;
}

export function isTempId(id: string) {
  return id.startsWith(TEMP_PREFIX);
}

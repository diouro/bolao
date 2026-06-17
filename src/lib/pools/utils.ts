const INVITE_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function slugifyPoolName(name: string) {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || "pool";
}

export function generateInviteCode(length = 8) {
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += INVITE_ALPHABET[Math.floor(Math.random() * INVITE_ALPHABET.length)];
  }

  return code;
}

export function buildUniqueSlug(baseName: string, takenSlugs: Set<string>) {
  const base = slugifyPoolName(baseName);
  let candidate = base;
  let suffix = 2;

  while (takenSlugs.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

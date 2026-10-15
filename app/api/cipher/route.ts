import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

const SYMBOLS = "!#$%&()*+,-./:;=";
const MAX_TEXT_LENGTH = 10_000;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const MAX_CIPHERTEXT_LENGTH = (IV_LENGTH + AUTH_TAG_LENGTH + MAX_TEXT_LENGTH * 4) * 2;
const KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/;

type CipherRequest = {
  action?: unknown;
  text?: unknown;
  key?: unknown;
};

function createByteMap(key: Buffer): { encode: string[]; decode: Map<string, number> } {
  const byteValues = Array.from({ length: 256 }, (_, index) => index);

  for (let index = byteValues.length - 1; index > 0; index -= 1) {
    const digest = createHmac("sha256", key)
      .update(`glyph-map-v1:${index}`)
      .digest();
    const swapIndex = digest.readUInt32BE(0) % (index + 1);
    [byteValues[index], byteValues[swapIndex]] = [byteValues[swapIndex], byteValues[index]];
  }

  const pairs = Array.from({ length: 256 }, (_, index) =>
    SYMBOLS[Math.floor(index / SYMBOLS.length)] + SYMBOLS[index % SYMBOLS.length],
  );
  const encode = new Array<string>(256);
  const decode = new Map<string, number>();

  byteValues.forEach((byte, index) => {
    encode[byte] = pairs[index];
    decode.set(pairs[index], byte);
  });

  return { encode, decode };
}

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: CipherRequest;

  try {
    body = (await request.json()) as CipherRequest;
  } catch {
    return errorResponse("Send a valid JSON request.", 400);
  }

  if (body.action !== "encrypt" && body.action !== "decrypt") {
    return errorResponse("Choose encrypt or decrypt.", 400);
  }

  if (typeof body.text !== "string" || body.text.length === 0) {
    return errorResponse("Enter some text to continue.", 400);
  }

  const maxLength = body.action === "encrypt" ? MAX_TEXT_LENGTH : MAX_CIPHERTEXT_LENGTH;
  if (body.text.length > maxLength) {
    const description = body.action === "encrypt" ? "Text" : "Ciphertext";
    return errorResponse(`${description} exceeds the supported size.`, 413);
  }

  if (body.action === "encrypt") {
    const key = randomBytes(32).toString("base64url");
    const keyBytes = Buffer.from(key, "base64url");
    const byteMap = createByteMap(keyBytes);
    const encryptionKey = createHmac("sha256", keyBytes).update("glyph-aes-v1").digest();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(body.text, "utf8"), cipher.final()]);
    const payload = Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
    const output = Array.from(payload, (byte) => byteMap.encode[byte]).join("");

    return Response.json({ result: output, key });
  }

  if (typeof body.key !== "string" || !KEY_PATTERN.test(body.key)) {
    return errorResponse("Enter the 43-character key created during encryption.", 400);
  }

  const keyBytes = Buffer.from(body.key, "base64url");
  if (keyBytes.length !== 32) {
    return errorResponse("That key is not valid.", 400);
  }

  const byteMap = createByteMap(keyBytes);
  const symbols = [...body.text];
  if (symbols.length % 2 !== 0 || symbols.length < (IV_LENGTH + AUTH_TAG_LENGTH) * 2) {
    return errorResponse("This ciphertext is incomplete or malformed.", 400);
  }

  const bytes: number[] = [];
  for (let index = 0; index < symbols.length; index += 2) {
    const pair = `${symbols[index]}${symbols[index + 1]}`;
    const byte = byteMap.decode.get(pair);
    if (byte === undefined) {
      return errorResponse("Ciphertext does not match this key.", 400);
    }
    bytes.push(byte);
  }

  try {
    const payload = Buffer.from(bytes);
    const iv = payload.subarray(0, IV_LENGTH);
    const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const encryptionKey = createHmac("sha256", keyBytes).update("glyph-aes-v1").digest();
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey, iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const result = new TextDecoder("utf-8", { fatal: true }).decode(plaintext);
    return Response.json({ result });
  } catch {
    return errorResponse("Ciphertext or key is invalid. Check both and try again.", 400);
  }
}
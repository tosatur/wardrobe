import { hash, verify, type Options } from "@node-rs/argon2";

const options: Options = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
  algorithm: 2, // argon2id
};

export async function hashPassword(password: string) {
  return hash(password, options);
}

export async function verifyPassword(data: { password: string; hash: string }) {
  return verify(data.hash, data.password, options);
}

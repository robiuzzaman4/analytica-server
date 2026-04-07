export function hash(password: string): Promise<string> {
  return Promise.resolve(`hashed:${password}`);
}

export function compare(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return Promise.resolve(hashedPassword === `hashed:${password}`);
}

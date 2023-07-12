import bcrypt from "bcryptjs";
import { getRandomAlphanumericToken } from "../../../src/utils/token.js";

const passwordLength = 20;
const saltLength = 10;

describe.skip("api / auth / passwords", () => {
  it("Benchmark bcryptjs", () => {
    const num = 100;

    const passwords: string[] = [];
    const passwordHashes: string[] = [];

    console.time(`generate ${num}`);
    for (let i = 0; i < num; i++) {
      const password = getRandomAlphanumericToken(passwordLength);
      const passwordHash = bcrypt.hashSync(password, saltLength);
      passwords.push(password);
      passwordHashes.push(passwordHash);
    }
    console.timeEnd(`generate ${num}`);

    console.time(`check valid ${num}`);
    for (let i = 0; i < num; i++) {
      if (!bcrypt.compareSync(passwords[i], passwordHashes[i])) {
        throw Error("Password should be valid");
      }
    }
    console.timeEnd(`check valid ${num}`);

    const wrongPassword = getRandomAlphanumericToken(passwordLength);
    console.time(`check invalid ${num}`);
    for (let i = 0; i < num; i++) {
      if (bcrypt.compareSync(wrongPassword, passwordHashes[i])) {
        throw Error("Password should be invalid");
      }
    }
    console.timeEnd(`check invalid ${num}`);
  });
});

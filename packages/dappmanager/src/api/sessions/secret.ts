import crypto from "crypto";
import { PlainTextFileDb } from "../../utils/fileDb.js";

export class SessionsSecretDb {
  private filedb: PlainTextFileDb;

  constructor(filepath: string) {
    this.filedb = new PlainTextFileDb(filepath);
  }

  get(): string {
    let secretKey = this.filedb.read();
    if (!secretKey) {
      secretKey = crypto.randomBytes(32).toString("hex");
      this.filedb.write(secretKey);
    }
    return secretKey;
  }

  destroy(): void {
    this.filedb.del();
  }
}

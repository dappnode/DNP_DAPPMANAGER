import crypto from "crypto";
import { SingleFileDb } from "../../utils/singleFileDb";

export class SessionsSecretDb {
  private filedb: SingleFileDb;
  constructor(filepath: string) {
    this.filedb = new SingleFileDb(filepath);
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

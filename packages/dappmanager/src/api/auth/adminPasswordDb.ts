import { JsonFileDb } from "../../utils/fileDb";
import { getRandomAlphanumericToken } from "../../utils/token";

const passwordLength = 16;

interface PasswordByIdMap {
  [id: string]: string; // password token
}

export interface AdminPasswordDbParams {
  ADMIN_PASSWORDS_JSON_FILE: string;
}

export class AdminPasswordDb {
  jsonDb: JsonFileDb<PasswordByIdMap>;

  constructor(params: AdminPasswordDbParams) {
    this.jsonDb = new JsonFileDb(params.ADMIN_PASSWORDS_JSON_FILE);
  }

  generatePasswordById(id: string): string {
    const passwordMap = this.read();
    if (!passwordMap[id]) {
      passwordMap[id] = getRandomAlphanumericToken(passwordLength);
      this.write(passwordMap);
    }
    return passwordMap[id];
  }

  getIdByPassword(password: string): string | null {
    const passwordMap = this.read();
    for (const [adminId, _password] of Object.entries(passwordMap)) {
      if (password === _password) return adminId;
    }
    return null;
  }

  hasAdminId(id: string): boolean {
    const passwordMap = this.read();
    return Boolean(passwordMap[id]);
  }

  removePasswordById(id: string): void {
    const passwordMap = this.read();
    delete passwordMap[id];
    this.write(passwordMap);
  }

  private read(): PasswordByIdMap {
    return this.jsonDb.read() || {};
  }

  private write(passwordMap: PasswordByIdMap): void {
    this.jsonDb.write(passwordMap);
  }
}

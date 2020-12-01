import { Store } from "express-session";
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import * as validate from "../../utils/validate";

interface OptionsLowdbSessionStore {
  dbPath: string;
  ttlMs?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SessionData = any;

interface DbSchema {
  [sid: string]: {
    expiresMs: number;
    session: SessionData;
  };
}

type Callback<T> = (err: Error | null, data?: T | null) => void;

export class SessionStoreLowDb extends Store {
  db: low.LowdbSync<DbSchema>;
  ttlMs: number;

  constructor({ dbPath, ttlMs }: OptionsLowdbSessionStore) {
    super();

    validate.path(dbPath);
    const adapter = new FileSync<DbSchema>(dbPath, { defaultValue: {} });
    this.db = low(adapter);
    this.ttlMs = ttlMs || 24 * 60 * 60 * 1000;
  }

  get(sid: string, callback: Callback<SessionData>): void {
    this.destroyExpired();
    const item = this.db.get(sid).value();
    callback(null, item ? item.session : null);
  }

  set(sid: string, session: SessionData, callback: Callback<void>): void {
    const item = { session, expiresMs: Date.now() + this.ttlMs };
    this.db.set(sid, item).write();
    callback(null);
  }

  destroy(sid: string, callback: Callback<void>): void {
    this.db.unset(sid).write();
    callback(null);
  }

  private destroyExpired(): void {
    const now = Date.now();
    const items = this.db.getState();

    const expiredSids: string[] = [];
    for (const [sid, item] of Object.entries(items)) {
      if (now > item.expiresMs) expiredSids.push(sid);
    }

    if (expiredSids.length > 0) {
      for (const sid of expiredSids) this.db.unset(sid);
      this.db.write();
    }
  }
}

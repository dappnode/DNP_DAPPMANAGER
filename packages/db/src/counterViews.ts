import { dbCache } from "./dbFactory.js";

const COUNTER_VIEWS = "counter-views";

export const counterViews = dbCache.staticKey<number>(COUNTER_VIEWS, 0);

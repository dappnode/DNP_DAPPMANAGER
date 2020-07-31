import { stringSplit } from "utils/strings";

export const stripVersion = (s: string) => stringSplit(s, "@")[0];

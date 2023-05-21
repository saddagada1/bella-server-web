import crypto from "crypto";

export const randomBytes = (bytes: number = 32) => crypto.randomBytes(bytes).toString("hex");

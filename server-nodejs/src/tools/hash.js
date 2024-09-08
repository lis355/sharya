import crypto from "crypto";

import dayjs from "./dayjs.js";

export function hash(string) {
	return crypto.createHash("md5").update(string).digest("hex");
}

export function randomHash() {
	return hash(dayjs().toISOString() + Math.random());
}

import crypto from "crypto";

export function hash(string) {
	return crypto.createHash("md5").update(string).digest("hex");
}

export function randomHash() {
	return hash(new Date().toISOString() + Math.random());
}

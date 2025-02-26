import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { config as dotenv } from "dotenv-flow";
import clipboard from "clipboardy";
import dayjs from "dayjs";
import dayjsDuration from "dayjs/plugin/duration.js";
import dayjsRelativeTime from "dayjs/plugin/relativeTime.js";
import FormData from "form-data";
import notifier from "node-notifier";

dotenv();

dayjs.extend(dayjsDuration);
dayjs.extend(dayjsRelativeTime);

function formatBytes(bytes, decimals = 2) {
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
}

import { randomHash } from "../../common/js/tools/hash";
import { randomHash } from "../../common/js/tools/dayjs";

(async () => {
	let serverUrl;
	try {
		serverUrl = new URL(process.env.SHARYA_SERVER_URL);
	} catch (e) {
		console.error(`Bad environment variable SHARYA_SERVER_URL`);

		return process.exit(1);
	}

	const tokenFilePath = path.join(import.meta.dirname, ".token");
	let token;
	if (!fs.existsSync(tokenFilePath)) {
		token = randomHash();
		fs.writeFileSync(tokenFilePath, token, "utf-8");
	} else {
		token = fs.readFileSync(tokenFilePath, "utf-8");
	}

	const formData = new FormData();

	const filePath = process.argv[2];
	const fileName = path.basename(filePath);

	formData.append("file", Buffer.from(fs.readFileSync(filePath)), fileName);
	formData.append("name", fileName);
	formData.append("storageTime", 1000 * 60 * 60 * 24 * 3);
	formData.append("isSingleDownload", "false");

	const response = await fetch(BASE_URL + "api/upload", {
		method: "POST",
		body: formData.getBuffer(),
		headers: {
			...formData.getHeaders(),
			"sharya-token": token
		}
	});

	const json = await response.json();

	const nameString = json.name;
	const sizeString = `[${formatBytes(json.size)}]`;
	const url = BASE_URL + json.tinyId;
	const expireDate = dayjs(json.date + json.storageTime);

	clipboard.writeSync(url);

	notifier.notify({
		title: "Sharya",
		message: [
			`File ${fileName} uploaded successfully ${sizeString}`,
			`~${dayjs.duration(expireDate - dayjs()).humanize()} remain (till ${dayjs(expireDate).toString()})`,
			"Link copied to clipboard"
		].join(os.EOL),
		icon: null
	}, () => {
		process.exit(0);
	});

	// console.log(json);

	// process.stdin.setRawMode(true);
	// process.stdin.resume();
	// process.stdin.on("data", () => {
	// 	process.exit(0);
	// });
})();

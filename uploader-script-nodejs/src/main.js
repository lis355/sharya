import fs from "node:fs";
import path from "node:path";

import { config as dotenv } from "dotenv-flow";
import chalk from "chalk";
import clipboard from "clipboardy";
import dayjs from "dayjs";
import dayjsDuration from "dayjs/plugin/duration.js";
import dayjsRelativeTime from "dayjs/plugin/relativeTime.js";
import FormData from "form-data";
import notifier from "node-notifier";
import urlJoin from "url-join";

import { randomHash } from "../../common/js/tools/hash.js";

dotenv();

dayjs.extend(dayjsDuration);
dayjs.extend(dayjsRelativeTime);

function formatBytes(bytes, decimals = 2) {
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
}

(async () => {
	try {
		console.log(`Sharya uploader v${JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "..", "package.json"), "utf-8")).version}`);
		console.log();

		const serverUrl = process.env.SHARYA_SERVER_URL;
		try {
			new URL(serverUrl);
		} catch (_) {
			throw new Error("Bad environment variable SHARYA_SERVER_URL");
		}

		const storageDurationInMilliseconds = dayjs.duration(process.env.SHARYA_FILE_STORAGE_DURATION).asMilliseconds();
		if (!Number.isFinite(storageDurationInMilliseconds) ||
			storageDurationInMilliseconds === 0) throw new Error("Bad environment variable or bad format SHARYA_FILE_STORAGE_DURATION");

		const tokenFilePath = path.resolve(import.meta.dirname, "..", ".token");
		let token;
		if (!fs.existsSync(tokenFilePath)) {
			token = randomHash();
			fs.writeFileSync(tokenFilePath, token, "utf-8");
		} else {
			token = fs.readFileSync(tokenFilePath, "utf-8");
		}

		const formData = new FormData();

		const filePath = process.argv[2];
		if (!fs.existsSync(filePath) ||
			!fs.lstatSync(filePath).isFile()) throw new Error("No file to upload");

		const fileName = path.basename(filePath);

		formData.append("file", Buffer.from(fs.readFileSync(filePath)), fileName);
		formData.append("name", fileName);
		formData.append("storageTime", storageDurationInMilliseconds);
		formData.append("isSingleDownload", "false");

		const response = await fetch(urlJoin(serverUrl, "api", "upload"), {
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
		const expireDate = dayjs(json.date + json.storageTime);

		const link = urlJoin(serverUrl, json.tinyId);

		console.log(`File ${nameString} uploaded successfully ${sizeString}`);
		console.log(`~${dayjs.duration(expireDate - dayjs()).humanize()} remain (till ${dayjs(expireDate).toString()})`);
		console.log();
		console.log(chalk.bgWhite(chalk.black(link)));
		console.log();
		console.log("Link copied to clipboard");

		await clipboard.write(link);

		notifier.notify({
			title: "Sharya",
			message: `File ${nameString} uploaded successfully ${sizeString}`,
			icon: null
		});
	} catch (error) {
		console.error(error.message);
	}

	console.log();
	console.log("Press any key...");

	process.stdin.setRawMode(true);
	process.stdin.resume();
	process.stdin.on("data", () => process.exit());
})();

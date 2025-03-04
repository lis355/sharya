import path from "node:path";

import fs from "fs-extra";

import dayjs from "../../common/js/tools/dayjs.js";
import db from "./db/index.js";
import TinyId from "./tools/TinyId.js";

const FILES_DIRECTORY = path.join(process.env.DATA, "files");
const FILE_BASE_NAME = "file.data";
const TINY_ID_GENERATION_MAX_ITERATIONS = 1000;
const CLEAR_OBSOLETE_FILES_TIMEOUT_DURATION = dayjs.duration({ days: 1 });

class Storage {
	constructor() {
		fs.ensureDirSync(FILES_DIRECTORY);

		this.#clearObsoleteFiles();
		setInterval(this.#clearObsoleteFiles.bind(this), CLEAR_OBSOLETE_FILES_TIMEOUT_DURATION.asMilliseconds());
	}

	findRecordByTinyId(tinyId) {
		return db.uploadedFile.findRecordByTinyId(tinyId);
	}

	findRecordByTinyIdAndUserToken(tinyId, userToken) {
		return db.uploadedFile.findRecordByTinyIdAndUserToken(tinyId, userToken);
	}

	findRecordsByUserToken(userToken) {
		return db.uploadedFile.findRecordsByUserToken(userToken);
	}

	prepareStorageForNewUploadFile() {
		const tinyId = this.#getNextTinyId();
		const fileDirectory = path.join(FILES_DIRECTORY, tinyId);
		const fileName = FILE_BASE_NAME;

		fs.ensureDirSync(fileDirectory);

		return {
			tinyId,
			fileDirectory,
			fileName
		};
	}

	createRecord({ tinyId, name, size, path, userToken, storageTime, isSingleDownload }) {
		const uploadedFileRecord = db.uploadedFile.createRecord({
			tinyId,
			name,
			size,
			path,
			userToken,
			date: dayjs().valueOf(),
			storageTime,
			isSingleDownload
		});

		return uploadedFileRecord;
	}

	deleteRecordByTinyId(tinyId) {
		this.#deleteDbRecordByTinyId(tinyId);
		this.#deleteFileByTinyId(tinyId);
	}

	incrementDownloadsAmountByTinyId(tinyId) {
		db.uploadedFile.incrementDownloadsAmountByTinyId(tinyId);
	}

	#getNextTinyId() {
		for (let i = 0; i < TINY_ID_GENERATION_MAX_ITERATIONS; i++) {
			const tinyId = TinyId.generate().toString();
			const hasTinyId = Boolean(this.findRecordByTinyId(tinyId));
			if (hasTinyId) continue;

			return tinyId;
		}

		throw new Error("Failed to get next tiny id");
	}

	#deleteDbRecordByTinyId(tinyId) {
		db.uploadedFile.deleteRecordByTinyId(tinyId);
	}

	#deleteFileByTinyId(tinyId) {
		fs.removeSync(path.join(FILES_DIRECTORY, tinyId));
	}

	#clearObsoleteFiles() {
		const uploadedFileRecords = db.uploadedFile.findRecords();
		const uploadedFileRecordsByTinyId = Object.fromEntries(uploadedFileRecords.map(fileRecord => [fileRecord.tinyId, fileRecord]));

		const now = dayjs().valueOf();

		fs.readdirSync(FILES_DIRECTORY).forEach(fileNameAsTinyId => {
			const fileRecord = uploadedFileRecordsByTinyId[fileNameAsTinyId];

			let removeFile = false;
			if (!fileRecord) {
				removeFile = true;
			} else if (fileRecord.date + fileRecord.storageTime < now) {
				removeFile = true;

				this.#deleteDbRecordByTinyId(fileNameAsTinyId);
			}

			delete uploadedFileRecordsByTinyId[fileNameAsTinyId];

			if (removeFile) this.#deleteFileByTinyId(fileNameAsTinyId);
		});

		Object.keys(uploadedFileRecordsByTinyId).forEach(tinyId => {
			this.#deleteDbRecordByTinyId(tinyId);
		});
	}
}

const storage = new Storage();

export default storage;

import path from "path";

import express from "express";
import fs from "fs-extra";
import httpStatus from "http-status-codes";
import multer from "multer";

import { randomHash } from "../tools/hash.js";
import dayjs from "../tools/dayjs.js";
import db from "../db/index.js";
import TinyId from "../tools/TinyId.js";

export const apiRouter = express.Router();

const HEADER_TOKEN = "sharya-token";

const FILES_DIRECTORY = path.join(process.env.DATA, "files");
const FILE_BASE_NAME = "file.data";

fs.ensureDirSync(FILES_DIRECTORY);

const TINY_ID_GENERATION_MAX_ITERATIONS = 1000;

function getNextTinyId() {
	for (let i = 0; i < TINY_ID_GENERATION_MAX_ITERATIONS; i++) {
		const tinyId = TinyId.generate().toString();
		const hasTinyId = Boolean(db.uploadedFile.findRecordByTinyId(tinyId));
		if (hasTinyId) continue;

		return tinyId;
	}

	throw new Error("Failed to get next tiny id");
}

function clearObsoleteFiles() {
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

			db.uploadedFile.deleteRecordByTinyId(fileNameAsTinyId);
		}

		delete uploadedFileRecordsByTinyId[fileNameAsTinyId];

		if (removeFile) fs.removeSync(path.join(FILES_DIRECTORY, fileNameAsTinyId));
	});

	Object.keys(uploadedFileRecordsByTinyId).forEach(tinyId => {
		db.uploadedFile.deleteRecordByTinyId(tinyId);
	});
}

const CLEAR_OBSOLETE_FILES_TIMEOUT_DURATION = dayjs.duration({ days: 1 });

clearObsoleteFiles();
setInterval(clearObsoleteFiles, CLEAR_OBSOLETE_FILES_TIMEOUT_DURATION.asMilliseconds());

function clampDbUploadedFileRecordWithTinyIdAndNameAndSize(record) {
	return {
		tinyId: record.tinyId,
		name: record.name,
		size: record.size
	};
}

apiRouter.use((req, res, next) => {
	const token = req.headers[HEADER_TOKEN];
	if (!token) req.headers[HEADER_TOKEN] = randomHash();

	return next();
});

apiRouter.get("/auth/", (req, res) => {
	return res.status(httpStatus.OK).send(req.headers[HEADER_TOKEN]);
});

apiRouter.post("/upload/",
	multer({
		storage: multer.diskStorage({
			destination: (req, file, callback) => {
				const tinyId = file.tinyId = getNextTinyId();
				const fileDirectory = file.fileDirectory = path.join(FILES_DIRECTORY, tinyId);
				const fileName = file.fileName = FILE_BASE_NAME;
				file.filePath = path.join(fileDirectory, fileName);

				fs.ensureDirSync(fileDirectory);

				return callback(null, fileDirectory);
			},
			filename: (req, file, callback) => {
				return callback(null, file.fileName);
			}
		})
	}).single("file"),
	(req, res) => {
		const { file, body } = req;

		const uploadedFileRecord = db.uploadedFile.createRecord({
			tinyId: file.tinyId,
			name: body.name,
			size: file.size,
			path: file.filePath,
			userToken: req.headers[HEADER_TOKEN],
			date: dayjs().valueOf(),
			storageTime: Number(body.storageTime)
		});

		return res.status(httpStatus.CREATED).send(clampDbUploadedFileRecordWithTinyIdAndNameAndSize(uploadedFileRecord));
	}
);

apiRouter.delete("/upload/:tinyId/",
	(req, res) => {
		const tinyId = req.params.tinyId;

		const uploadedFileRecord = db.uploadedFile.findRecordByTinyIdAndUserToken(tinyId, req.headers[HEADER_TOKEN]);
		if (!uploadedFileRecord) return res.sendStatus(httpStatus.NOT_FOUND);

		db.uploadedFile.deleteRecordByTinyId(tinyId);

		fs.removeSync(path.join(FILES_DIRECTORY, tinyId));

		return res.sendStatus(httpStatus.OK);
	}
);

apiRouter.get("/uploadedFiles/", (req, res) => {
	const uploadedFileRecords = db.uploadedFile.findRecordsByUserToken(req.headers[HEADER_TOKEN]);

	return res.status(httpStatus.OK).send(uploadedFileRecords.map(clampDbUploadedFileRecordWithTinyIdAndNameAndSize));
});

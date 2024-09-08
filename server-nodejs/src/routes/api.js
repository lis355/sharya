import path from "path";

import express from "express";
import fs from "fs-extra";
import httpStatus from "http-status-codes";
import multer from "multer";

import dayjs from "../tools/dayjs.js";
import TinyId from "../tools/TinyId.js";
import UploadedFilesDB from "../db/UploadedFilesDB.js";

export const apiRouter = express.Router();

const HEADER_TOKEN = "sharya-token";

const FILES_DIRECTORY = path.join(process.env.DATA, "files");
const FILE_BASE_NAME = "file.data";

const TINY_ID_FILE_DIRECTORY_MAX_ITERATIONS = 1000;

function getNextTinyId() {
	for (let i = 0; i < TINY_ID_FILE_DIRECTORY_MAX_ITERATIONS; i++) {
		const tinyId = TinyId.generate().toString();
		const hasTinyId = Boolean(UploadedFilesDB.findRecordByTinyId(tinyId));
		if (hasTinyId) continue;

		return tinyId;
	}

	throw new Error("Failed to get next tiny id");
}

function clearObsoleteFiles() {
	const fileRecords = UploadedFilesDB.findRecords();
	const fileRecordsByTinyId = Object.fromEntries(fileRecords.map(fileRecord => [fileRecord.tinyId, fileRecord]));

	const now = dayjs().valueOf();

	fs.readdirSync(FILES_DIRECTORY).forEach(fileNameAsTinyId => {
		const fileRecord = fileRecordsByTinyId[fileNameAsTinyId];

		let removeFile = false;
		if (!fileRecord) {
			removeFile = true;
		} else if (fileRecord.date + fileRecord.storageTime < now) {
			removeFile = true;

			UploadedFilesDB.deleteRecordByTinyId(fileNameAsTinyId);
		}

		delete fileRecordsByTinyId[fileNameAsTinyId];

		if (removeFile) fs.removeSync(path.join(FILES_DIRECTORY, fileNameAsTinyId));
	});

	Object.keys(fileRecordsByTinyId).forEach(tinyId => {
		UploadedFilesDB.deleteRecordByTinyId(tinyId);
	});
}

const CLEAR_OBSOLETE_FILES_TIMEOUT_DURATION = dayjs.duration({ days: 1 });

clearObsoleteFiles();
setInterval(clearObsoleteFiles, CLEAR_OBSOLETE_FILES_TIMEOUT_DURATION.asMilliseconds());

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
		const file = req.file;
		const storageTime = Number(req.body.storageTime);
		const tinyId = file.tinyId;

		UploadedFilesDB.createRecord({
			tinyId,
			name: file.originalname,
			size: file.size,
			path: file.filePath,
			userToken: req.headers[HEADER_TOKEN],
			date: dayjs().valueOf(),
			storageTime
		});

		const record = UploadedFilesDB.findRecordWithTinyIdAndNameAndSizeByTinyId(tinyId);

		return res.status(httpStatus.OK).send(record);
	}
);

apiRouter.delete("/upload/:tinyId/",
	(req, res) => {
		const tinyId = req.params.tinyId;

		const fileRecord = UploadedFilesDB.findRecordByTinyIdAndUserToken(tinyId, req.headers[HEADER_TOKEN]);
		if (!fileRecord) return res.sendStatus(httpStatus.FORBIDDEN);

		UploadedFilesDB.deleteRecordByTinyId(tinyId);

		fs.removeSync(path.join(FILES_DIRECTORY, tinyId));

		return res.sendStatus(httpStatus.OK);
	}
);

apiRouter.get("/uploadedFiles/", (req, res) => {
	const uploadedFileRecords = UploadedFilesDB.findRecordsWithTinyIdAndNameAndSizeByUserToken(req.headers[HEADER_TOKEN]);

	return res.status(httpStatus.OK).send(uploadedFileRecords);
});

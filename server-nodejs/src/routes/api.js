import path from "node:path";

import express from "express";
import httpStatus from "http-status-codes";
import multer from "multer";

import { randomHash } from "../../../common/js/tools/hash.js";
import storage from "../storage.js";

export const apiRouter = express.Router();

const HEADER_TOKEN = "sharya-token";

function generateRandomUserToken() {
	return randomHash();
}

function serializeForClient(record) {
	return {
		tinyId: record.tinyId,
		name: record.name,
		size: record.size,
		date: record.date,
		storageTime: record.storageTime,
		downloadsAmount: record.downloadsAmount,
		isSingleDownload: Boolean(record.isSingleDownload)
	};
}

apiRouter.use((req, res, next) => {
	const userToken = req.headers[HEADER_TOKEN];
	if (!userToken) req.headers[HEADER_TOKEN] = generateRandomUserToken();

	return next();
});

apiRouter.get("/auth/", (req, res) => {
	const userToken = req.headers[HEADER_TOKEN];

	return res.status(httpStatus.OK).send(userToken);
});

apiRouter.post("/upload/",
	(req, res, next) => {
		return next();
	},
	multer({
		storage: multer.diskStorage({
			destination: (req, file, callback) => {
				const { tinyId, fileDirectory, fileName } = storage.prepareStorageForNewUploadFile();

				file.tinyId = tinyId;
				file.fileDirectory = fileDirectory;
				file.fileName = fileName;
				file.filePath = path.join(fileDirectory, fileName);

				return callback(null, fileDirectory);
			},
			filename: (req, file, callback) => {
				return callback(null, file.fileName);
			}
		})
	}).single("file"),
	(req, res) => {
		const { file, body } = req;
		const { storageTime, isSingleDownload } = body;
		const userToken = req.headers[HEADER_TOKEN];

		const uploadedFileRecord = storage.createRecord({
			tinyId: file.tinyId,
			name: body.name,
			size: file.size,
			path: file.filePath,
			userToken,
			storageTime: Number(storageTime),
			isSingleDownload: isSingleDownload === "true"
		});

		return res.status(httpStatus.CREATED).send(serializeForClient(uploadedFileRecord));
	}
);

apiRouter.delete("/upload/:tinyId/",
	(req, res) => {
		const tinyId = req.params.tinyId;
		const userToken = req.headers[HEADER_TOKEN];

		const uploadedFileRecord = storage.findRecordByTinyIdAndUserToken(tinyId, userToken);
		if (!uploadedFileRecord) return res.sendStatus(httpStatus.NOT_FOUND);

		storage.deleteRecordByTinyId(tinyId);

		return res.sendStatus(httpStatus.NO_CONTENT);
	}
);

apiRouter.get("/uploadedFiles/", (req, res) => {
	const userToken = req.headers[HEADER_TOKEN];

	const uploadedFileRecords = storage.findRecordsByUserToken(userToken);

	return res.status(httpStatus.OK).send(uploadedFileRecords.map(serializeForClient));
});

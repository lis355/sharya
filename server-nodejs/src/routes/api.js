import path from "node:path";

import express from "express";
import httpStatus from "http-status-codes";
import multer from "multer";
import cookieParser from "cookie-parser";

import { randomHash } from "../../../common/js/tools/hash.js";
import storage from "../storage.js";

export const apiRouter = express.Router();

const COOKIES_SECRET = "sharya-cookies";
apiRouter.use(cookieParser(COOKIES_SECRET));

const HEADER_TOKEN_NAME = "sharya-token";
const COOKIE_TOKEN_NAME = "sharya-token";

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
	req.userToken = req.headers[HEADER_TOKEN_NAME];
	if (!req.userToken) {
		req.userToken = req.signedCookies[COOKIE_TOKEN_NAME];

		if (!req.userToken) {
			req.userToken = generateRandomUserToken();

			res.cookie(COOKIE_TOKEN_NAME, req.userToken, { signed: true });
		}
	}

	return next();
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

		const uploadedFileRecord = storage.createRecord({
			tinyId: file.tinyId,
			name: body.name,
			size: file.size,
			path: file.filePath,
			userToken: req.userToken,
			storageTime: Number(storageTime),
			isSingleDownload: isSingleDownload === "true"
		});

		return res.status(httpStatus.CREATED).send(serializeForClient(uploadedFileRecord));
	}
);

apiRouter.delete("/upload/:tinyId/",
	(req, res) => {
		const tinyId = req.params.tinyId;

		const uploadedFileRecord = storage.findRecordByTinyIdAndUserToken(tinyId, req.userToken);
		if (!uploadedFileRecord) return res.sendStatus(httpStatus.NOT_FOUND);

		storage.deleteRecordByTinyId(tinyId);

		return res.sendStatus(httpStatus.NO_CONTENT);
	}
);

apiRouter.get("/uploadedFiles/", (req, res) => {
	const uploadedFileRecords = storage.findRecordsByUserToken(req.userToken);

	return res.status(httpStatus.OK).send(uploadedFileRecords.map(serializeForClient));
});

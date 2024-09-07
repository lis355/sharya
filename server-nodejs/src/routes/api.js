import path from "path";

import express from "express";
import fs from "fs-extra";
import httpStatus from "http-status-codes";
import multer from "multer";

import TinyId from "../tools/TinyId.js";

export const apiRouter = express.Router();

const HEADER_TOKEN = "sharya-token";

const FILE_BASE_NAME = "file.data";
const FILE_INFO_NAME = "info.json";
const FILES_DIRECTORY = path.join(process.env.CWD, "files");
const TINY_ID_FILE_DIRECTORY_MAX_ITERATIONS = 1000;

function getNextTinyIdWithFileDirectory() {
	for (let i = 0; i < TINY_ID_FILE_DIRECTORY_MAX_ITERATIONS; i++) {
		const tinyId = TinyId.generate();
		const fileDirectory = path.join(FILES_DIRECTORY, tinyId);
		if (fs.existsSync(fileDirectory)) continue;

		return { tinyId, fileDirectory };
	}

	throw new Error("Failed to get next tiny id");
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
				const { tinyId, fileDirectory } = getNextTinyIdWithFileDirectory();
				file.tinyId = tinyId;
				file.fileDirectory = fileDirectory;

				fs.ensureDirSync(file.fileDirectory);

				return callback(null, file.fileDirectory);
			},
			filename: (req, file, callback) => {
				return callback(null, FILE_BASE_NAME);
			}
		})
	}).single("file"),
	(req, res) => {
		const file = req.file;
		const tinyId = file.tinyId;

		fs.outputJSONSync(path.join(file.fileDirectory, FILE_INFO_NAME), {
			tinyId,
			name: file.originalname,
			token: req.headers[HEADER_TOKEN]
		});

		return res.status(httpStatus.OK).send(tinyId);
	}
);

apiRouter.get("/uploadedFiles/", (req, res) => {
	return res.status(httpStatus.OK).send([]);
});

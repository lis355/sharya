import crypto from "node:crypto";
import path from "node:path";

import { config as dotenv } from "dotenv-flow";
import cors from "cors";
import express from "express";
import fs from "fs-extra";
import httpStatus from "http-status-codes";
import multer from "multer";

dotenv();

const CWD = path.resolve(process.cwd());

function hash(string) {
	return crypto.createHash("md5").update(string).digest("hex");
}

function randomHash() {
	return hash(new Date().toISOString() + Math.random());
}

const TINY_ID_CHARACTERS = ["bcdefghijklmnopqrstuvwxyz", "aeiouy"];
const TINY_ID_LENGTH = 4;

function randomTinyId() {
	let tinyId = "";
	for (let i = 0; i < TINY_ID_LENGTH; i++) {
		const array = TINY_ID_CHARACTERS[i % TINY_ID_CHARACTERS.length];
		tinyId += array[Math.floor(Math.random() * array.length)];
	}

	return tinyId;
}

const FILE_BASE_NAME = "file.data";
const FILE_INFO_NAME = "info.json";

const filesDirectory = path.join(CWD, "files");

const TINY_ID_FILE_DIRECTORY_MAX_ITERATIONS = 1000;

function getNextTinyIdWithFileDirectory() {
	for (let i = 0; i < TINY_ID_FILE_DIRECTORY_MAX_ITERATIONS; i++) {
		const tinyId = randomTinyId();
		const fileDirectory = path.join(filesDirectory, tinyId);
		if (fs.existsSync(fileDirectory)) continue;

		return { tinyId, fileDirectory };
	}

	throw new Error("Failed to get next tiny id");
}

const application = express();
application.disable("x-powered-by");
application.use(cors());

const apiRouter = express.Router();
application.use("/api/", apiRouter);

const HEADER_TOKEN = "sharya-token";

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

application.get("/:id/",
	(req, res) => {
		const fileDirectory = path.join(filesDirectory, req.params.id);
		if (!fs.existsSync(fileDirectory)) return res.sendStatus(httpStatus.NOT_FOUND);

		const info = fs.readJSONSync(path.join(fileDirectory, FILE_INFO_NAME));
		const filePath = path.join(fileDirectory, FILE_BASE_NAME);

		if (!fs.existsSync(filePath)) return res.sendStatus(httpStatus.NOT_FOUND);

		return res.download(filePath, info.name);
	}
);

application.delete("/:id/",
	(req, res) => {
		const fileDirectory = path.join(filesDirectory, req.params.id);
		if (!fs.existsSync(fileDirectory)) return res.sendStatus(httpStatus.FORBIDDEN);

		const info = fs.readJSONSync(path.join(fileDirectory, FILE_INFO_NAME));
		if (info.token !== req.headers[HEADER_TOKEN]) return res.sendStatus(httpStatus.FORBIDDEN);

		fs.removeSync(fileDirectory);

		return res.sendStatus(httpStatus.OK);
	}
);

const homePageDirectory = path.resolve(process.env.HOME_PAGE_DIRECTORY);
application.use(express.static(homePageDirectory));

application.get("*", (req, res) => res.sendFile(path.join(homePageDirectory, "index.html")));

application.all("*", (req, res) => res.redirect("/"));

const port = Number(process.env.PORT);
application.listen(port, () => {
	console.log(`Server started on http://localhost:${port}`);
});

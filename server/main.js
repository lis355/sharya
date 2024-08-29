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

const application = express();
application.disable("x-powered-by");
application.use(cors());

const apiRouter = express.Router();
application.use("/api/", apiRouter);

const FILE_BASE_NAME = "file.data";
const FILE_INFO_NAME = "info.json";

const filesDirectory = path.join(CWD, "files");

apiRouter.post("/upload/",
	multer({
		storage: multer.diskStorage({
			destination: (req, file, callback) => {
				file.hash = crypto.createHash("md5").update(file.originalname).digest("hex");

				file.fileDirectory = path.join(filesDirectory, file.hash);
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

		fs.outputJSONSync(path.join(file.fileDirectory, FILE_INFO_NAME), {
			hash: file.hash,
			name: file.originalname
		});

		return res.status(httpStatus.OK).send(file.hash);
	}
);

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

const homePageDirectory = path.resolve(process.env.HOME_PAGE_DIRECTORY);
application.use(express.static(homePageDirectory));

application.get("*", (req, res) => res.sendFile(path.join(homePageDirectory, "index.html")));

application.all("*", (req, res) => res.redirect("/"));

const port = Number(process.env.PORT);
application.listen(port, () => {
	console.log(`Server started on http://localhost:${port}`);
});

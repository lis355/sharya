import path from "path";

import express from "express";
import filenamify from "filenamify";
import httpStatus from "http-status-codes";

import UploadedFilesDB from "../db/UploadedFilesDB.js";

export const appRouter = express.Router();

appRouter.get("/:tinyId/",
	(req, res) => {
		const tinyId = req.params.tinyId;

		const fileRecord = UploadedFilesDB.findRecordByTinyId(tinyId);
		if (!fileRecord) return res.sendStatus(httpStatus.NOT_FOUND);

		return res.download(fileRecord.path, filenamify(fileRecord.name, { replacement: "_" }));
	}
);

const homePageDirectory = path.resolve(process.env.HOME_PAGE_DIRECTORY);
appRouter.use(express.static(homePageDirectory));

appRouter.get("*", (req, res) => res.sendFile(path.join(homePageDirectory, "index.html")));

appRouter.all("*", (req, res) => res.redirect("/"));

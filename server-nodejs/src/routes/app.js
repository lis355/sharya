import path from "path";

import express from "express";
import filenamify from "filenamify";
import httpStatus from "http-status-codes";

import storage from "../storage.js";

export const appRouter = express.Router();

appRouter.get("/:tinyId/",
	(req, res) => {
		const tinyId = req.params.tinyId;

		const uploadedFileRecord = storage.findRecordByTinyId(tinyId);
		if (!uploadedFileRecord) return res.sendStatus(httpStatus.NOT_FOUND);

		const downloadFileName = filenamify(uploadedFileRecord.name, { replacement: "_" });

		return res.download(uploadedFileRecord.path, downloadFileName, error => {
			if (!error) {
				if (uploadedFileRecord.isSingleDownload) storage.deleteRecordByTinyId(tinyId);
				else storage.incrementDownloadsAmountByTinyId(tinyId);
			} else console.error(error);
		});
	}
);

const homePageDirectory = path.resolve(process.env.HOME_PAGE_DIRECTORY);
appRouter.use(express.static(homePageDirectory));

appRouter.get("*", (req, res) => res.sendFile(path.join(homePageDirectory, "index.html")));

appRouter.all("*", (req, res) => res.redirect("/"));

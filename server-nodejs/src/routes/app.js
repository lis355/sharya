import path from "path";

import express from "express";
import filenamify from "filenamify";

export const appRouter = express.Router();

appRouter.get("/:id/",
	(req, res) => {
		const fileDirectory = path.join(filesDirectory, req.params.id);
		if (!fs.existsSync(fileDirectory)) return res.sendStatus(httpStatus.NOT_FOUND);

		const info = fs.readJSONSync(path.join(fileDirectory, FILE_INFO_NAME));
		const filePath = path.join(fileDirectory, FILE_BASE_NAME);

		if (!fs.existsSync(filePath)) return res.sendStatus(httpStatus.NOT_FOUND);

		return res.download(filePath, filenamify(info.name, { replacement: '_' }));
	}
);

appRouter.delete("/:id/",
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
appRouter.use(express.static(homePageDirectory));

appRouter.get("*", (req, res) => res.sendFile(path.join(homePageDirectory, "index.html")));

appRouter.all("*", (req, res) => res.redirect("/"));

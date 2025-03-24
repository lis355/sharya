import express from "express";
import cors from "cors";

import { apiRouter } from "./routes/api.js";
import { appRouter } from "./routes/app.js";

const application = express();
application.disable("x-powered-by");

const corsOptions = {};
if (process.env.IS_DEVELOPMENT === "true") {
	corsOptions.credentials = true;
	corsOptions.origin = process.env.FRONT_END_DEVELOPMENT_URL;
}

application.use(cors(corsOptions));

application.use("/api/", apiRouter);
application.use(appRouter);

const port = Number(process.env.PORT);
application.listen(port, () => {
	console.log(`[SERVER]: HTTP server started on http://localhost:${port}`);
});

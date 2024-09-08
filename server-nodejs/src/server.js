import express from "express";
import cors from "cors";

import { apiRouter } from "./routes/api.js";
import { appRouter } from "./routes/app.js";

const application = express();
application.disable("x-powered-by");
application.use(cors());

application.use("/api/", apiRouter);
application.use(appRouter);

const port = Number(process.env.PORT);
application.listen(port, () => {
	console.log(`Server started on http://localhost:${port}`);
});

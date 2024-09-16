import path from "path";
import { DatabaseSync } from "node:sqlite";

import UploadedFile from "./models/UploadedFile.js";

const database = new DatabaseSync(path.join(process.env.DATA, "./db.data"));
console.log("[DB]: sqlite version:", database.prepare("SELECT SQLITE_VERSION() as version").get().version.trim());

const uploadedFile = new UploadedFile(database);
// uploadedFile.drop();
uploadedFile.initialize();
// uploadedFile.debugPrintAllRecords();

export default {
	uploadedFile
};

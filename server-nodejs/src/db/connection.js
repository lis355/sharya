import path from "path";

import { DatabaseSync } from "node:sqlite";

export default new DatabaseSync(path.join(process.env.DATA, "./db.data"));

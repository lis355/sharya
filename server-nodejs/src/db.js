import path from "path";

import { DatabaseSync } from "node:sqlite";

const database = new DatabaseSync(path.join(process.env.DATA, "./db.data"));

// database.exec("DROP TABLE files;");

database.exec(`
	CREATE TABLE IF NOT EXISTS files (
		tinyId TEXT PRIMARY KEY,
		name TEXT,
		size INTEGER,
		path TEXT,
		userToken TEXT,
		date INTEGER,
		storageTime INTEGER
	) STRICT;

	CREATE INDEX IF NOT EXISTS tinyIdIndex ON files (tinyId);
	CREATE INDEX IF NOT EXISTS userTokenIndex ON files (userToken);
	CREATE INDEX IF NOT EXISTS dateIndex ON files (date);
`);

export default database;

// console.log(JSON.stringify(database.prepare("SELECT * FROM files").all(), null, 2));

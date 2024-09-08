import database from "./connection.js";

const DB_NAME = "uploadedFiles";

export default class UploadedFilesDB {
	static drop() {
		database.exec(`DROP TABLE ${DB_NAME};`);
	}

	static initialize() {
		database.exec(`
			CREATE TABLE IF NOT EXISTS ${DB_NAME} (
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
	}

	static debugPrintAllRecords() {
		console.log(JSON.stringify(database.prepare(`SELECT * FROM ${DB_NAME}`).all(), null, 2));
	}

	static createRecord({ tinyId, name, size, path, userToken, date, storageTime }) {
		database
			.prepare(`INSERT INTO ${DB_NAME} (tinyId, name, size, path, userToken, date, storageTime) VALUES (?, ?, ?, ?, ?, ?, ?)`)
			.run(tinyId, name, size, path, userToken, date, storageTime);
	}

	static deleteRecordByTinyId(tinyId) {
		database
			.prepare(`DELETE FROM ${DB_NAME} WHERE tinyId = (?)`)
			.run(tinyId);
	}

	static findRecords() {
		return database
			.prepare("SELECT * FROM files")
			.all();
	}

	static findRecordByTinyId(tinyId) {
		return database
			.prepare(`SELECT * FROM ${DB_NAME} WHERE tinyId = (?)`)
			.get(tinyId);
	}

	static findRecordWithTinyIdAndNameAndSizeByTinyId(tinyId) {
		return database
			.prepare(`SELECT tinyId, name, size FROM ${DB_NAME} WHERE tinyId = (?)`)
			.get(tinyId);
	}

	static findRecordsWithTinyIdAndNameAndSizeByUserToken(userToken) {
		return database
			.prepare(`SELECT tinyId, name, size FROM ${DB_NAME} WHERE userToken = (?)`)
			.all(userToken);
	}

	static findRecordByTinyIdAndUserToken(tinyId, userToken) {
		return database
			.prepare(`SELECT * FROM ${DB_NAME} WHERE tinyId = (?) AND userToken = (?)`)
			.get(tinyId, userToken);
	}
}

package uploadedFile

import (
	"fmt"

	"sharya-server/db"

	_ "github.com/mattn/go-sqlite3"
)

type UploadedFile struct {
	TinyId      string `json:"tinyId"`
	Name        string `json:"name"`
	Size        int    `json:"size"`
	Path        string `json:"path"`
	UserToken   string `json:"userToken"`
	Date        int    `json:"date"`
	StorageTime int    `json:"storageTime"`
}

const dbName = "uploadedFiles"

func Clear() error {
	_, err := db.DB.Exec(fmt.Sprintf("DROP TABLE IF EXISTS %[1]s", dbName))
	if err != nil {
		fmt.Println(err)
		return err
	}

	return nil
}

func Initialize() error {
	_, err := db.DB.Exec(fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %[1]s (tinyId TEXT, name TEXT, size INTEGER, path TEXT, userToken TEXT, date INTEGER, storageTime INTEGER) STRICT;
		
		CREATE INDEX IF NOT EXISTS tinyIdIndex ON %[1]s (tinyId);
		CREATE INDEX IF NOT EXISTS userTokenIndex ON %[1]s (userToken);
		CREATE INDEX IF NOT EXISTS dateIndex ON %[1]s (date);
	`, dbName))

	if err != nil {
		fmt.Println(err)
		return err
	}

	return nil
}

func DebugPrintAllRecords() error {
	rows, err := db.DB.Query(fmt.Sprintf(`
		SELECT * FROM %[1]s
	`, dbName))

	if err != nil {
		fmt.Println(err)
		return err
	}

	defer rows.Close()

	for rows.Next() {
		var uploadedFile UploadedFile
		err := rows.Scan(&uploadedFile.TinyId, &uploadedFile.Name, &uploadedFile.Size, &uploadedFile.Path, &uploadedFile.UserToken, &uploadedFile.Date, &uploadedFile.StorageTime)

		if err != nil {
			fmt.Println(err)
			return err
		}

		fmt.Println(uploadedFile)
	}

	return nil
}

func CreateRecord(uploadedFile UploadedFile) error {
	_, err := db.DB.Exec(fmt.Sprintf(`
		INSERT INTO %[1]s (tinyId, name, size, path, userToken, date, storageTime) VALUES (?, ?, ?, ?, ?, ?, ?)
	`, dbName), uploadedFile.TinyId, uploadedFile.Name, uploadedFile.Size, uploadedFile.Path, uploadedFile.UserToken, uploadedFile.Date, uploadedFile.StorageTime)

	if err != nil {
		fmt.Println(err)
		return err
	}

	return nil
}

// static deleteRecordByTinyId(tinyId) {
// 	database
// 		.prepare(`DELETE FROM ${DB_NAME} WHERE ${FIELD_TINY_ID} = (?)`)
// 		.run(tinyId);
// }

// static findRecords() {
// 	return database
// 		.prepare(`SELECT * FROM ${DB_NAME}`)
// 		.all();
// }

func FindRecordByTinyId(tinyId string) (*UploadedFile, error) {
	row := db.DB.QueryRow(fmt.Sprintf(`
		SELECT * FROM %[1]s WHERE tinyId = (?) 
	`, dbName), tinyId)

	if row == nil {
		return nil, nil
	}

	var uploadedFile UploadedFile
	err := row.Scan(&uploadedFile.TinyId, &uploadedFile.Name, &uploadedFile.Size, &uploadedFile.Path, &uploadedFile.UserToken, &uploadedFile.Date, &uploadedFile.StorageTime)

	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	return &uploadedFile, nil
}

// static findRecordWithTinyIdAndNameAndSizeByTinyId(tinyId) {
// 	return database
// 		.prepare(`SELECT ${FIELD_TINY_ID}, ${FIELD_NAME}, ${FIELD_SIZE} FROM ${DB_NAME} WHERE ${FIELD_TINY_ID} = (?)`)
// 		.get(tinyId);
// }

func FindRecordsWithTinyIdAndNameAndSizeByUserToken(userToken string) ([]*UploadedFile, error) {
	rows, err := db.DB.Query(fmt.Sprintf(`
		SELECT tinyId, name, size FROM %[1]s WHERE userToken = (?)
	`, dbName), userToken)

	if err != nil {
		fmt.Println(err)
		return []*UploadedFile{}, err
	}

	defer rows.Close()

	result := []*UploadedFile{}

	for rows.Next() {
		var uploadedFile UploadedFile
		err := rows.Scan(&uploadedFile.TinyId, &uploadedFile.Name, &uploadedFile.Size, &uploadedFile.Path, &uploadedFile.UserToken, &uploadedFile.Date, &uploadedFile.StorageTime)

		if err != nil {
			fmt.Println(err)
			return []*UploadedFile{}, err
		}

		result = append(result, &uploadedFile)
	}

	return result, nil
}

// static findRecordByTinyIdAndUserToken(tinyId, userToken) {
// 	return database
// 		.prepare(`SELECT * FROM ${DB_NAME} WHERE ${FIELD_TINY_ID} = (?) AND ${FIELD_USER_TOKEN} = (?)`)
// 		.get(tinyId, userToken);
// }

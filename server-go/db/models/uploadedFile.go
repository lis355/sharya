package dbUploadedFile

import (
	"fmt"

	_ "github.com/mattn/go-sqlite3"

	"sharya-server/db"
)

type UploadedFile struct {
	TinyId      string `json:"tinyId,omitempty"`
	Name        string `json:"name,omitempty"`
	Size        int    `json:"size,omitempty"`
	Path        string `json:"path,omitempty"`
	UserToken   string `json:"userToken,omitempty"`
	Date        int    `json:"date,omitempty"`
	StorageTime int    `json:"storageTime,omitempty"`
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

func DeleteRecordByTinyId(tinyId string) error {
	_, err := db.DB.Exec(fmt.Sprintf(`
		DELETE FROM %[1]s WHERE tinyId = (?) 
	`, dbName), tinyId)

	if err != nil {
		fmt.Println(err)
		return err
	}

	return nil
}

func FindRecords() ([]*UploadedFile, error) {
	rows, err := db.DB.Query(fmt.Sprintf(`
		SELECT * FROM %[1]s
	`, dbName))

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

func FindRecordByTinyId(tinyId string) (*UploadedFile, error) {
	rows, err := db.DB.Query(fmt.Sprintf(`
		SELECT * FROM %[1]s WHERE tinyId = (?) 
	`, dbName), tinyId)

	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var uploadedFile UploadedFile
		err := rows.Scan(&uploadedFile.TinyId, &uploadedFile.Name, &uploadedFile.Size, &uploadedFile.Path, &uploadedFile.UserToken, &uploadedFile.Date, &uploadedFile.StorageTime)

		if err != nil {
			fmt.Println(err)
			return nil, err
		} else {
			return &uploadedFile, nil
		}
	}

	return nil, nil
}

func FindRecordWithTinyIdAndNameAndSizeByTinyId(tinyId string) (*UploadedFile, error) {
	rows, err := db.DB.Query(fmt.Sprintf(`
		SELECT tinyId, name, size FROM %[1]s WHERE tinyId = (?)
	`, dbName), tinyId)

	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var uploadedFile UploadedFile
		err := rows.Scan(&uploadedFile.TinyId, &uploadedFile.Name, &uploadedFile.Size)

		if err != nil {
			fmt.Println(err)
			return nil, err
		} else {
			return &uploadedFile, nil
		}
	}

	return nil, nil
}

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
		err := rows.Scan(&uploadedFile.TinyId, &uploadedFile.Name, &uploadedFile.Size)

		if err != nil {
			fmt.Println(err)
			return []*UploadedFile{}, err
		}

		result = append(result, &uploadedFile)
	}

	return result, nil
}

func FindRecordByTinyIdAndUserToken(tinyId string, userToken string) (*UploadedFile, error) {
	rows, err := db.DB.Query(fmt.Sprintf(`
		SELECT * FROM %[1]s WHERE tinyId = (?) AND userToken = (?)
	`, dbName), tinyId, userToken)

	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var uploadedFile UploadedFile
		err := rows.Scan(&uploadedFile.TinyId, &uploadedFile.Name, &uploadedFile.Size, &uploadedFile.Path, &uploadedFile.UserToken, &uploadedFile.Date, &uploadedFile.StorageTime)

		if err != nil {
			fmt.Println(err)
			return nil, err
		} else {
			return &uploadedFile, nil
		}
	}

	return nil, nil
}

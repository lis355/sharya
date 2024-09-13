package uploadedfile

import (
	"fmt"

	_ "github.com/mattn/go-sqlite3"

	"sharya-server/db"
)

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
		var uploadedFile db.UploadedFile
		err := rows.Scan(&uploadedFile.TinyId, &uploadedFile.Name, &uploadedFile.Size, &uploadedFile.Path, &uploadedFile.UserToken, &uploadedFile.Date, &uploadedFile.StorageTime)

		if err != nil {
			fmt.Println(err)
			return err
		}

		fmt.Println(uploadedFile)
	}

	return nil
}

func CreateRecord(uploadedFile db.UploadedFile) error {
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

func FindRecords() ([]*db.UploadedFile, error) {
	rows, err := db.DB.Query(fmt.Sprintf(`
		SELECT * FROM %[1]s
	`, dbName))

	if err != nil {
		fmt.Println(err)
		return []*db.UploadedFile{}, err
	}

	defer rows.Close()

	result := []*db.UploadedFile{}

	for rows.Next() {
		var uploadedFile db.UploadedFile
		err := rows.Scan(&uploadedFile.TinyId, &uploadedFile.Name, &uploadedFile.Size, &uploadedFile.Path, &uploadedFile.UserToken, &uploadedFile.Date, &uploadedFile.StorageTime)

		if err != nil {
			fmt.Println(err)
			return []*db.UploadedFile{}, err
		}

		result = append(result, &uploadedFile)
	}

	return result, nil
}

func FindRecordByTinyId(tinyId string) (*db.UploadedFile, error) {
	rows, err := db.DB.Query(fmt.Sprintf(`
		SELECT * FROM %[1]s WHERE tinyId = (?) 
	`, dbName), tinyId)

	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var uploadedFile db.UploadedFile
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

func FindRecordWithTinyIdAndNameAndSizeByTinyId(tinyId string) (*db.UploadedFile, error) {
	rows, err := db.DB.Query(fmt.Sprintf(`
		SELECT tinyId, name, size FROM %[1]s WHERE tinyId = (?)
	`, dbName), tinyId)

	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var uploadedFile db.UploadedFile
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

func FindRecordsWithTinyIdAndNameAndSizeByUserToken(userToken string) ([]*db.UploadedFile, error) {
	rows, err := db.DB.Query(fmt.Sprintf(`
		SELECT tinyId, name, size FROM %[1]s WHERE userToken = (?)
	`, dbName), userToken)

	if err != nil {
		fmt.Println(err)
		return []*db.UploadedFile{}, err
	}

	defer rows.Close()

	result := []*db.UploadedFile{}

	for rows.Next() {
		var uploadedFile db.UploadedFile
		err := rows.Scan(&uploadedFile.TinyId, &uploadedFile.Name, &uploadedFile.Size)

		if err != nil {
			fmt.Println(err)
			return []*db.UploadedFile{}, err
		}

		result = append(result, &uploadedFile)
	}

	return result, nil
}

func FindRecordByTinyIdAndUserToken(tinyId string, userToken string) (*db.UploadedFile, error) {
	rows, err := db.DB.Query(fmt.Sprintf(`
		SELECT * FROM %[1]s WHERE tinyId = (?) AND userToken = (?)
	`, dbName), tinyId, userToken)

	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		var uploadedFile db.UploadedFile
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

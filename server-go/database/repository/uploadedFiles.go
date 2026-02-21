package repository

import (
	"database/sql"
	"fmt"

	"sharya-server/database/models"
)

const dbName = "uploadedFiles"

type UploadedFiles struct {
	db *sql.DB
}

func NewUploadedFiles(db *sql.DB) *UploadedFiles {
	return &UploadedFiles{db}
}

func (uploadedFiles *UploadedFiles) Clear() error {
	_, err := uploadedFiles.db.Exec(fmt.Sprintf(`
		DROP TABLE IF EXISTS %[1]s
	`, dbName))

	return err
}

func (uploadedFiles *UploadedFiles) Initialize() error {
	_, err := uploadedFiles.db.Exec(fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %[1]s (
			tinyId TEXT,
			name TEXT,
			size INTEGER,
			path TEXT,
			userToken TEXT,
			date INTEGER,
			storageTime INTEGER,
			downloadsAmount INTEGER,
			isSingleDownload INTEGER
		) STRICT;
		
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

func (uploadedFiles *UploadedFiles) ScanUploadedFile(rows *sql.Rows, uploadedFile *models.UploadedFile) error {
	return rows.Scan(
		&uploadedFile.TinyId,
		&uploadedFile.Name,
		&uploadedFile.Size,
		&uploadedFile.Path,
		&uploadedFile.UserToken,
		&uploadedFile.Date,
		&uploadedFile.StorageTime,
		&uploadedFile.DownloadsAmount,
		&uploadedFile.IsSingleDownload,
	)
}

func (uploadedFiles *UploadedFiles) CreateRecord(uploadedFile *models.UploadedFile) error {
	_, err := uploadedFiles.db.Exec(fmt.Sprintf(`
		INSERT INTO %[1]s (tinyId, name, size, path, userToken, date, storageTime, downloadsAmount, isSingleDownload) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, dbName),
		uploadedFile.TinyId,
		uploadedFile.Name,
		uploadedFile.Size,
		uploadedFile.Path,
		uploadedFile.UserToken,
		uploadedFile.Date,
		uploadedFile.StorageTime,
		uploadedFile.DownloadsAmount,
		uploadedFile.IsSingleDownload)

	return err
}

func (uploadedFiles *UploadedFiles) FirstRecordByRows(rows *sql.Rows) (*models.UploadedFile, error) {
	for rows.Next() {
		var uploadedFile models.UploadedFile
		err := uploadedFiles.ScanUploadedFile(rows, &uploadedFile)

		if err != nil {
			return nil, err
		} else {
			return &uploadedFile, nil
		}
	}

	return nil, nil
}

func (uploadedFiles *UploadedFiles) RecordsByRows(rows *sql.Rows) ([]*models.UploadedFile, error) {
	result := []*models.UploadedFile{}

	for rows.Next() {
		var uploadedFile models.UploadedFile
		err := uploadedFiles.ScanUploadedFile(rows, &uploadedFile)

		if err != nil {
			return []*models.UploadedFile{}, err
		}

		result = append(result, &uploadedFile)
	}

	return result, nil
}

func (uploadedFiles *UploadedFiles) DebugPrintAllRecords() error {
	rows, err := uploadedFiles.db.Query(fmt.Sprintf(`
		SELECT * FROM %[1]s
	`, dbName))

	if err != nil {
		fmt.Println(err)

		return err
	}

	defer rows.Close()

	for rows.Next() {
		var uploadedFile models.UploadedFile
		err = uploadedFiles.ScanUploadedFile(rows, &uploadedFile)

		if err != nil {
			return err
		}

		fmt.Println(uploadedFile)
	}

	records, err := uploadedFiles.RecordsByRows(rows)
	if err != nil {
		return err
	}

	for _, uploadedFile := range records {
		fmt.Println(uploadedFile)
	}

	return nil
}

func (uploadedFiles *UploadedFiles) DeleteRecordByTinyId(tinyId string) error {
	_, err := uploadedFiles.db.Exec(fmt.Sprintf(`
		DELETE FROM %[1]s WHERE tinyId = (?) 
	`, dbName), tinyId)

	return err
}

func (uploadedFiles *UploadedFiles) FindRecordByTinyId(tinyId string) (*models.UploadedFile, error) {
	rows, err := uploadedFiles.db.Query(fmt.Sprintf(`
		SELECT * FROM %[1]s WHERE tinyId = (?) 
	`, dbName), tinyId)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	return uploadedFiles.FirstRecordByRows(rows)
}

func (uploadedFiles *UploadedFiles) FindRecordByTinyIdAndUserToken(tinyId string, userToken string) (*models.UploadedFile, error) {
	rows, err := uploadedFiles.db.Query(fmt.Sprintf(`
		SELECT * FROM %[1]s WHERE tinyId = (?) AND userToken = (?)
	`, dbName), tinyId, userToken)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	return uploadedFiles.FirstRecordByRows(rows)
}

func (uploadedFiles *UploadedFiles) FindRecords() ([]*models.UploadedFile, error) {
	rows, err := uploadedFiles.db.Query(fmt.Sprintf(`
		SELECT * FROM %[1]s
	`, dbName))

	if err != nil {
		return []*models.UploadedFile{}, err
	}

	defer rows.Close()

	return uploadedFiles.RecordsByRows(rows)
}

func (uploadedFiles *UploadedFiles) FindRecordsByUserToken(userToken string) (result []*models.UploadedFile, err error) {
	rows, err := uploadedFiles.db.Query(fmt.Sprintf(`
		SELECT * FROM %[1]s WHERE userToken = (?)
	`, dbName), userToken)

	if err != nil {
		return []*models.UploadedFile{}, err
	}

	defer rows.Close()

	return uploadedFiles.RecordsByRows(rows)
}

// IncrementDownloads увеличивает счетчик скачиваний для файла по tinyId
func (uploadedFiles *UploadedFiles) IncrementDownloadsAmountByTinyId(tinyId string) error {
	result, err := uploadedFiles.db.Exec(fmt.Sprintf(`
        UPDATE %[1]s 
        SET downloadsAmount = downloadsAmount + 1 
        WHERE tinyId = ?
    `, dbName), tinyId)

	if err != nil {
		return err
	}

	// Проверяем, был ли обновлен какой-либо файл
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("No file with tinyId %s", tinyId)
	}

	return nil
}

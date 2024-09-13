package uploadedfiles

import (
	"os"
	"path/filepath"
	"time"

	"sharya-server/db"
	uploadedfile "sharya-server/db/models"
	"sharya-server/tools"
)

type uploadFilesManager struct {
}

var UploadFilesManager = uploadFilesManager{}

const clearObsoleteFilesInterval = 24 * time.Hour

func GetFilesDataDirectory() string {
	return filepath.Join(tools.DataDirectory, "files")
}

func (m *uploadFilesManager) Initialize() {
	m.clearObsoleteFiles()

	go func() {
		tick := time.Tick(clearObsoleteFilesInterval)
		for range tick {
			m.clearObsoleteFiles()
		}
	}()
}

func (m *uploadFilesManager) clearObsoleteFiles() {
	records, _ := uploadedfile.FindRecords()

	recordsMapByTinyId := make(map[string]*db.UploadedFile, len(records))
	for _, record := range records {
		recordsMapByTinyId[record.TinyId] = record
	}

	now := tools.UnixNowInt32()

	entries, _ := os.ReadDir(GetFilesDataDirectory())
	for _, e := range entries {
		fileNameAsTinyId := e.Name()

		uploadFile, ok := recordsMapByTinyId[fileNameAsTinyId]

		removeFile := false

		if !ok {
			removeFile = true
		} else if uploadFile.Date+uploadFile.StorageTime < now {
			removeFile = true
		}

		delete(recordsMapByTinyId, fileNameAsTinyId)

		if removeFile {
			os.RemoveAll(filepath.Join(GetFilesDataDirectory(), fileNameAsTinyId))
		}
	}

	for tinyId := range recordsMapByTinyId {
		uploadedfile.DeleteRecordByTinyId(tinyId)
	}
}

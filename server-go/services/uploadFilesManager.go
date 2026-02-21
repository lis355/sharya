package services

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"time"

	"sharya-server/app"
	"sharya-server/database"
	"sharya-server/database/models"
)

const (
	uploadedFileNameExtension = ".data"
)

type uploadFilesManager struct {
	UploadedFileNameExtension string
	FilesDataDirectory        string
}

var UploadFilesManager = uploadFilesManager{}

const clearObsoleteFilesInterval = 24 * time.Hour

func (manager *uploadFilesManager) Initialize() {
	manager.UploadedFileNameExtension = uploadedFileNameExtension
	manager.FilesDataDirectory = filepath.Join(app.DataDirectory, "files")

	err := os.MkdirAll(manager.FilesDataDirectory, os.ModeDir)
	if err != nil {
		panic(err)
	}

	manager.clearObsoleteFiles()

	go func() {
		tick := time.Tick(clearObsoleteFilesInterval)
		for range tick {
			manager.clearObsoleteFiles()
		}
	}()
}

func (manager *uploadFilesManager) ValidateUploadFile(uploadFile *models.UploadedFile) bool {
	if uploadFile == nil {
		return false
	}

	if uploadFile.Date+uploadFile.StorageTime < time.Now().UnixMilli() {
		return false
	}

	return true
}

func (manager *uploadFilesManager) clearObsoleteFiles() {
	slog.Debug("uploadFilesManager start clearObsoleteFiles")
	defer slog.Debug("uploadFilesManager finish clearObsoleteFiles")

	uploadFiles, err := database.DB.UploadedFiles.FindRecords()
	if err != nil {
		slog.Error(err.Error())

		return
	}

	slog.Debug(fmt.Sprintf("found %d UploadFiles in db", len(uploadFiles)))

	uploadFilesMapByTinyId := make(map[string]*models.UploadedFile, len(uploadFiles))
	for _, uploadFile := range uploadFiles {
		uploadFilesMapByTinyId[uploadFile.TinyId] = uploadFile
	}

	directoryEntries, err := os.ReadDir(manager.FilesDataDirectory)
	if err != nil {
		slog.Error(err.Error())

		return
	}

	slog.Debug(fmt.Sprintf("found %d directory entries in %s", len(directoryEntries), manager.FilesDataDirectory))

	for _, directoryEntry := range directoryEntries {
		if directoryEntry.IsDir() {
			continue
		}

		fileNameAsTinyId := directoryEntry.Name()
		if !strings.HasSuffix(fileNameAsTinyId, manager.UploadedFileNameExtension) {
			continue
		}

		fileNameAsTinyId = strings.TrimSuffix(fileNameAsTinyId, manager.UploadedFileNameExtension)

		uploadFile, hasUploadFile := uploadFilesMapByTinyId[fileNameAsTinyId]

		removeFile := !hasUploadFile ||
			!manager.ValidateUploadFile(uploadFile)

		delete(uploadFilesMapByTinyId, fileNameAsTinyId) // удаляем из мапы в любом случае, чтобы потом не удалить записи

		if removeFile {
			filePath := filepath.Join(manager.FilesDataDirectory, fileNameAsTinyId)
			err := os.RemoveAll(filePath)
			if err != nil {
				slog.Error(err.Error())

				return
			}

			slog.Debug(fmt.Sprintf("file %s removed", filePath))
		}
	}

	for tinyId := range uploadFilesMapByTinyId {
		err := database.DB.UploadedFiles.DeleteRecordByTinyId(tinyId)
		if err != nil {
			slog.Error(err.Error())

			return
		}

		slog.Debug(fmt.Sprintf("record %s removed", tinyId))
	}
}

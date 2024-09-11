package main

import (
	"sharya-server/db"
	uploadedFile "sharya-server/db/models"
	"sharya-server/server"
	"sharya-server/tools"
)

var DataDirectory string

func main() {
	tools.InitializeEnvironment()
	tools.InitializeDataDirectory()

	db.OpenDB()
	// uploadedFile.Clear()
	uploadedFile.Initialize()
	// uploadedFile.DebugPrintAllRecords()
	// uploadedFile.CreateRecord(uploadedFile.UploadedFile{
	// 	TinyId:      "test",
	// 	Name:        "test",
	// 	Size:        1,
	// 	Path:        "test",
	// 	UserToken:   "test",
	// 	Date:        1,
	// 	StorageTime: 1,
	// })

	server.StartServer()
}

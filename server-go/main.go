package main

import (
	"sharya-server/components/uploadedfiles"
	"sharya-server/db"
	uploadedfile "sharya-server/db/models"
	"sharya-server/server"
	"sharya-server/tools"
)

func main() {
	tools.InitializeEnvironment()
	tools.InitializeDataDirectory()

	db.OpenDB()

	if tools.IsDevelopment {
		// uploadedfile.Clear()
	}

	uploadedfile.Initialize()

	if tools.IsDevelopment {
		// uploadedfile.DebugPrintAllRecords()
	}

	uploadedfiles.UploadFilesManager.Initialize()

	server.StartServer()
}

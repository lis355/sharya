package main

import (
	uf "sharya-server/components/uploadFiles"
	"sharya-server/db"
	uploadedfile "sharya-server/db/models/uploadedFile"
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

	uf.UploadFilesManager.Initialize()

	server.StartServer()
}

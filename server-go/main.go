package main

import (
	"sharya-server/app"
	"sharya-server/database"
	"sharya-server/server"
	"sharya-server/services"
	"sharya-server/utils/log"
)

func main() {
	app.Initialize()
	log.Initialize()

	database.Initialize()

	if app.IsDevelopment {
		// database.DB.UploadedFiles.Clear()
		// database.DB.UploadedFiles.DebugPrintAllRecords()
	}

	services.UploadFilesManager.Initialize()

	server.Start()
}

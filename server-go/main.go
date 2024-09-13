package main

import (
	"sharya-server/db"
	uploadedFile "sharya-server/db/models"
	"sharya-server/server"
	"sharya-server/tools"
)

func main() {
	tools.InitializeEnvironment()
	tools.InitializeDataDirectory()

	db.OpenDB()

	if tools.IsDevelopment {
		// uploadedFile.Clear()
	}

	uploadedFile.Initialize()

	if tools.IsDevelopment {
		uploadedFile.DebugPrintAllRecords()
	}

	server.StartServer()
}

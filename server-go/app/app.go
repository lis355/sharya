package app

import (
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

const (
	dataDirectoryName = ".data"
)

var IsDevelopment bool
var DataDirectory string

func Initialize() {
	godotenv.Overload(".env", ".env.local")

	IsDevelopment = os.Getenv("DEVELOPMENT") == "true"

	dataDirectory, err := filepath.Abs(dataDirectoryName)
	if err != nil {
		panic(err)
	}

	if _, err := os.Stat(dataDirectory); os.IsNotExist(err) {
		if err := os.Mkdir(dataDirectory, os.ModeDir); err != nil {
			panic(err)
		}
	}

	DataDirectory = dataDirectory
}

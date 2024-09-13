package tools

import (
	"os"
	"path/filepath"
)

var dataDirectory, _ = filepath.Abs(".data")

func GetDataDirectory() string {
	return dataDirectory
}

func InitializeDataDirectory() {
	os.Mkdir(GetDataDirectory(), os.ModeDir)
}

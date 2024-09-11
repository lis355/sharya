package tools

import (
	"os"
	"path/filepath"
)

var DataDirectory string

func InitializeDataDirectory() {
	DataDirectory, _ = filepath.Abs(".data")
	os.Mkdir(DataDirectory, os.ModeDir)
}

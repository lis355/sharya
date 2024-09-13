package tools

import (
	"os"
	"path/filepath"
)

var DataDirectory, _ = filepath.Abs(".data")

func InitializeDataDirectory() {
	os.Mkdir(DataDirectory, os.ModeDir)
}

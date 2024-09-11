package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func OpenDB() {
	dataDirectory, _ := filepath.Abs(".data")
	os.Mkdir(dataDirectory, os.ModeDir)

	// for Windows, install http://tdm-gcc.tdragon.net/download

	var err error
	DB, err = sql.Open("sqlite3", filepath.Join(dataDirectory, "db.data"))
	if err != nil {
		fmt.Println(err)
		return
	}

	// defer DB.Close()

	err = DB.Ping()
	if err != nil {
		fmt.Println(err)
		return
	}
}

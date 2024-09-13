package db

import (
	"database/sql"
	"fmt"
	"path/filepath"

	"sharya-server/tools"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func OpenDB() {
	// for Windows, install http://tdm-gcc.tdragon.net/download

	var err error
	DB, err = sql.Open("sqlite3", filepath.Join(tools.DataDirectory, "db.data"))
	if err != nil {
		fmt.Println(err)
		return
	}

	err = DB.Ping()
	if err != nil {
		fmt.Println(err)
		return
	}
}

func CloseDB() {
	DB.Close()
}

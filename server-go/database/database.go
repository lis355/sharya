package database

import (
	"database/sql"
	"fmt"
	"log/slog"
	"path/filepath"
	"sharya-server/app"
	"sharya-server/database/repository"

	_ "github.com/mattn/go-sqlite3"
)

type DataBase struct {
	sqlDb *sql.DB

	UploadedFiles *repository.UploadedFiles
}

var DB *DataBase

func Initialize() {
	DB = NewDB()
	DB.OpenDB()
	DB.Initialize()
}

func NewDB() *DataBase {
	return &DataBase{}
}

func (db *DataBase) OpenDB() {
	// for Windows, install http://tdm-gcc.tdragon.net/download

	dbDataFilepath := filepath.Join(app.DataDirectory, "db.data")

	if sqlDb, err := sql.Open("sqlite3", dbDataFilepath); err != nil {
		panic(err)
	} else {
		db.sqlDb = sqlDb
	}

	if err := db.sqlDb.Ping(); err != nil {
		panic(err)
	}

	slog.Info(fmt.Sprintf("sql lite opened at %s", dbDataFilepath))
}

func (db *DataBase) Initialize() {
	db.UploadedFiles = repository.NewUploadedFiles(db.sqlDb)
	db.UploadedFiles.Initialize()
}

func (db *DataBase) CloseDB() {
	db.sqlDb.Close()

	slog.Info("sqllite closed")
}

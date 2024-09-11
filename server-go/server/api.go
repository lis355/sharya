package server

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/go-chi/chi/v5"

	uploadedFile "sharya-server/db/models"
	"sharya-server/tools"
)

const headerToken = "sharya-token"

type userToken struct{}

var userTokenKey = userToken{}

const fileBaseName = "file.data"

const tinyIdGenerationMaxIterations = 1000

var FilesDataDirectory = filepath.Join(tools.DataDirectory, "files")

func getNextTinyId() (string, error) {
	tinyId := ""
	for i := 0; i < tinyIdGenerationMaxIterations; i++ {
		tinyId = tools.GenetareTinyId()
		if uploadedFileRecord, _ := uploadedFile.FindRecordByTinyId(tinyId); uploadedFileRecord != nil {
			continue
		}

		return tinyId, nil
	}

	return "", fmt.Errorf("failed to get next tiny id after %d iterations", tinyIdGenerationMaxIterations)
}

func ApiRouter() http.Handler {
	router := chi.NewRouter()

	router.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := r.Header.Get(headerToken)
			if token == "" {
				token = tools.RandomHash()
			}

			ctx := context.WithValue(r.Context(), userTokenKey, token)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	})

	router.Get("/auth", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(r.Context().Value(userTokenKey).(string)))
		w.WriteHeader(http.StatusOK)
	})

	router.Post("/upload", func(w http.ResponseWriter, r *http.Request) {
		tinyId, err := getNextTinyId()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		file, _, _ := r.FormFile("file")
		defer file.Close()

		fileName := r.FormValue("name")
		fileStorageTime, _ := strconv.Atoi(r.FormValue("storageTime"))

		filePath := filepath.Join(FilesDataDirectory, tinyId, fileBaseName)
		dst, _ := os.Create(filePath)
		defer dst.Close()

		io.Copy(dst, file)

		fileInfo, _ := os.Stat(filePath)

		uploadedFile.CreateRecord(uploadedFile.UploadedFile{
			TinyId:      tinyId,
			Name:        fileName,
			Size:        int(fileInfo.Size()),
			Path:        filePath,
			UserToken:   r.Context().Value(userTokenKey).(string),
			Date:        int(fileInfo.ModTime().Unix()),
			StorageTime: fileStorageTime,
		})

		w.WriteHeader(http.StatusCreated)
	})

	router.Get("/uploadedFiles", func(w http.ResponseWriter, r *http.Request) {
		uploadedFileRecords, _ := uploadedFile.FindRecordsWithTinyIdAndNameAndSizeByUserToken(r.Context().Value(userTokenKey).(string))

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(uploadedFileRecords)
		w.WriteHeader(http.StatusOK)
	})

	router.NotFound(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	})

	return router
}

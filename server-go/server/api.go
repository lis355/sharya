package server

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"

	dbUploadedFile "sharya-server/db/models"
	"sharya-server/tools"
)

const headerToken = "sharya-token"

type userToken struct{}

var userTokenKey = userToken{}

func GetContextWithUserToken(r *http.Request, token string) context.Context {
	return context.WithValue(r.Context(), userTokenKey, token)
}

func GetUserTokenFromRequest(r *http.Request) string {
	return r.Context().Value(userTokenKey).(string)
}

const fileBaseName = "file.data"

const tinyIdGenerationMaxIterations = 1000

func GetFilesDataDirectory() string {
	return filepath.Join(tools.GetDataDirectory(), "files")
}

func getNextTinyId() (string, error) {
	tinyId := ""
	for i := 0; i < tinyIdGenerationMaxIterations; i++ {
		tinyId = tools.GenetareTinyId()
		if uploadedFileRecord, _ := dbUploadedFile.FindRecordByTinyId(tinyId); uploadedFileRecord != nil {
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

			ctx := GetContextWithUserToken(r, token)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	})

	router.Get("/auth", func(w http.ResponseWriter, r *http.Request) {
		WriteTextResponse(w, GetUserTokenFromRequest(r), http.StatusOK)
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

		filePath := filepath.Join(GetFilesDataDirectory(), tinyId, fileBaseName)

		os.MkdirAll(filepath.Dir(filePath), os.ModeDir)

		dst, _ := os.Create(filePath)
		defer dst.Close()

		io.Copy(dst, file)

		fileInfo, _ := os.Stat(filePath)

		uploadedFile := dbUploadedFile.UploadedFile{
			TinyId:      tinyId,
			Name:        fileName,
			Size:        int(fileInfo.Size()),
			Path:        filePath,
			UserToken:   GetUserTokenFromRequest(r),
			Date:        int(time.Now().Unix()),
			StorageTime: fileStorageTime,
		}

		dbUploadedFile.CreateRecord(uploadedFile)

		uploadedFileRecord, _ := dbUploadedFile.FindRecordWithTinyIdAndNameAndSizeByTinyId(tinyId)

		WriteJsonResponse(w, uploadedFileRecord, http.StatusCreated)
	})

	router.Delete("/upload/{tinyId}", func(w http.ResponseWriter, r *http.Request) {
		tinyId := chi.URLParam(r, "tinyId")

		uploadedFileRecord, _ := dbUploadedFile.FindRecordByTinyIdAndUserToken(tinyId, GetUserTokenFromRequest(r))
		if uploadedFileRecord == nil {
			w.WriteHeader(http.StatusNotFound)
		} else {
			dbUploadedFile.DeleteRecordByTinyId(tinyId)

			os.RemoveAll(filepath.Dir(uploadedFileRecord.Path))

			w.WriteHeader(http.StatusOK)
		}
	})

	router.Get("/uploadedFiles", func(w http.ResponseWriter, r *http.Request) {
		uploadedFileRecords, _ := dbUploadedFile.FindRecordsWithTinyIdAndNameAndSizeByUserToken(GetUserTokenFromRequest(r))

		WriteJsonResponse(w, uploadedFileRecords, http.StatusOK)
	})

	router.NotFound(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	})

	return router
}

// function clearObsoleteFiles() {
// 	const fileRecords = UploadedFilesDB.findRecords();
// 	const fileRecordsByTinyId = Object.fromEntries(fileRecords.map(fileRecord => [fileRecord.tinyId, fileRecord]));

// 	const now = dayjs().valueOf();

// 	fs.readdirSync(FILES_DIRECTORY).forEach(fileNameAsTinyId => {
// 		const fileRecord = fileRecordsByTinyId[fileNameAsTinyId];

// 		let removeFile = false;
// 		if (!fileRecord) {
// 			removeFile = true;
// 		} else if (fileRecord.date + fileRecord.storageTime < now) {
// 			removeFile = true;

// 			UploadedFilesDB.deleteRecordByTinyId(fileNameAsTinyId);
// 		}

// 		delete fileRecordsByTinyId[fileNameAsTinyId];

// 		if (removeFile) fs.removeSync(path.join(FILES_DIRECTORY, fileNameAsTinyId));
// 	});

// 	Object.keys(fileRecordsByTinyId).forEach(tinyId => {
// 		UploadedFilesDB.deleteRecordByTinyId(tinyId);
// 	});
// }

// const CLEAR_OBSOLETE_FILES_TIMEOUT_DURATION = dayjs.duration({ days: 1 });

// clearObsoleteFiles();
// setInterval(clearObsoleteFiles, CLEAR_OBSOLETE_FILES_TIMEOUT_DURATION.asMilliseconds());

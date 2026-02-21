package server

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"

	"sharya-server/app"
	"sharya-server/database"
	"sharya-server/database/models"
	"sharya-server/server/dto"
	"sharya-server/services"
	"sharya-server/utils/random"
	"sharya-server/utils/tinyId"
)

const (
	tokenHeader  = "sharya-token"
	userTokenKey = "userToken"
)

func GetContextWithUserToken(r *http.Request, token string) context.Context {
	return context.WithValue(r.Context(), userTokenKey, token)
}

func GetUserTokenFromRequest(r *http.Request) string {
	return r.Context().Value(userTokenKey).(string)
}

const tinyIdGenerationMaxIterations = 16

func getNextTinyId() (id string, err error) {
	for i := 0; i < tinyIdGenerationMaxIterations; i++ {
		id = tinyId.GenetareTinyId()
		if uploadedFileRecord, _ := database.DB.UploadedFiles.FindRecordByTinyId(id); uploadedFileRecord != nil {
			continue
		}

		return
	}

	return "", fmt.Errorf("failed to get next tiny id after %d iterations", tinyIdGenerationMaxIterations)
}

func createTokenAndCookieProcessorMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var token string

		tokenCookie, err := r.Cookie(tokenHeader)
		if err == nil {
			token = tokenCookie.Value
		}

		if token == "" {
			token = random.RandomHash()

			var cookie *http.Cookie
			if app.IsDevelopment {
				cookie = &http.Cookie{
					Name:  tokenHeader,
					Value: token,
				}
			} else {
				cookie = &http.Cookie{
					Name:     tokenHeader,
					Value:    token,
					HttpOnly: true,
					Secure:   true,
					SameSite: http.SameSiteStrictMode,
				}
			}

			http.SetCookie(w, cookie)
		}

		ctx := GetContextWithUserToken(r, token)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func ApiRouter() http.Handler {
	router := chi.NewRouter()

	router.Use(createTokenAndCookieProcessorMiddleware)

	router.Post("/upload", func(w http.ResponseWriter, r *http.Request) {
		tinyId, err := getNextTinyId()
		if err != nil {
			slog.Error(err.Error())

			w.WriteHeader(http.StatusInternalServerError)

			return
		}

		formFile, _, err := r.FormFile("file")
		if err != nil {
			slog.Error(err.Error())

			w.WriteHeader(http.StatusInternalServerError)

			return
		}

		defer formFile.Close()

		fileName := r.FormValue("name")
		fileStorageTime, err := strconv.ParseInt(r.FormValue("storageTime"), 10, 64)
		if err != nil {
			slog.Error(err.Error())

			w.WriteHeader(http.StatusInternalServerError)

			return
		}

		filePath := filepath.Join(services.UploadFilesManager.FilesDataDirectory, tinyId+services.UploadFilesManager.UploadedFileNameExtension)

		err = os.MkdirAll(filepath.Dir(filePath), os.ModeDir)
		if err != nil {
			slog.Error(err.Error())

			w.WriteHeader(http.StatusInternalServerError)

			return
		}

		destinationFile, err := os.Create(filePath)
		if err != nil {
			slog.Error(err.Error())

			w.WriteHeader(http.StatusInternalServerError)

			return
		}

		defer destinationFile.Close()

		_, err = io.Copy(destinationFile, formFile)
		if err != nil {
			slog.Error(err.Error())

			w.WriteHeader(http.StatusInternalServerError)

			return
		}

		fileInfo, err := os.Stat(filePath)
		if err != nil {
			slog.Error(err.Error())

			w.WriteHeader(http.StatusInternalServerError)

			return
		}

		isSingleDownload, err := strconv.ParseBool(r.FormValue("isSingleDownload"))
		if err != nil {
			slog.Error(err.Error())

			w.WriteHeader(http.StatusInternalServerError)

			return
		}

		uploadedFile := models.UploadedFile{
			TinyId:           tinyId,
			Name:             fileName,
			Size:             fileInfo.Size(),
			Path:             filePath,
			UserToken:        GetUserTokenFromRequest(r),
			Date:             time.Now().UnixMilli(),
			StorageTime:      fileStorageTime,
			DownloadsAmount:  0,
			IsSingleDownload: isSingleDownload,
		}

		if err := database.DB.UploadedFiles.CreateRecord(&uploadedFile); err != nil {
			slog.Error(err.Error())

			w.WriteHeader(http.StatusInternalServerError)

			return
		}

		slog.Debug("UploadedFile created " + fmt.Sprint(uploadedFile))

		WriteJsonResponse(w, dto.NewUploadedFileResponse(&uploadedFile), http.StatusCreated)
	})

	router.Delete("/upload/{tinyId}", func(w http.ResponseWriter, r *http.Request) {
		tinyId := chi.URLParam(r, "tinyId")

		var err error

		uploadedFileRecord, err := database.DB.UploadedFiles.FindRecordByTinyIdAndUserToken(tinyId, GetUserTokenFromRequest(r))
		if err != nil {
			slog.Error(err.Error())

			w.WriteHeader(http.StatusInternalServerError)

			return
		}

		if uploadedFileRecord == nil {
			w.WriteHeader(http.StatusNotFound)

			return
		}

		deleteRecordError := database.DB.UploadedFiles.DeleteRecordByTinyId(tinyId)
		removeFileError := os.RemoveAll(uploadedFileRecord.Path)

		if deleteRecordError != nil {
			slog.Error(deleteRecordError.Error())

			w.WriteHeader(http.StatusInternalServerError)

			return
		}

		if removeFileError != nil {
			slog.Error(removeFileError.Error())

			w.WriteHeader(http.StatusInternalServerError)

			return
		}

		slog.Debug("UploadedFile deleted " + tinyId)

		w.WriteHeader(http.StatusOK)
	})

	router.Get("/uploadedFiles", func(w http.ResponseWriter, r *http.Request) {
		uploadedFileRecords, err := database.DB.UploadedFiles.FindRecordsByUserToken(GetUserTokenFromRequest(r))
		if err != nil {
			slog.Error(err.Error())

			w.WriteHeader(http.StatusInternalServerError)

			return
		}

		slog.Debug(fmt.Sprintf("UploadedFiles got %d", len(uploadedFileRecords)))

		WriteJsonResponse(w, dto.NewUploadedFilesListResponse(uploadedFileRecords), http.StatusOK)
	})

	router.NotFound(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	})

	return router
}

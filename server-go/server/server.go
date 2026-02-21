package server

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/flytam/filenamify"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"

	"sharya-server/app"
	"sharya-server/database"
	"sharya-server/services"
)

func WriteTextResponse(w http.ResponseWriter, text string, statusCode int) {
	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(statusCode)
	w.Write([]byte(text))
}

func WriteJsonResponse(w http.ResponseWriter, v any, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(v)
}

func mainRouter() http.Handler {
	router := chi.NewRouter()

	if app.IsDevelopment {
		router.Use(func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				slog.Debug(fmt.Sprintf("%s %s %s %s", r.Method, r.URL.Path, r.RemoteAddr, r.Header.Get("User-Agent")))

				next.ServeHTTP(w, r)
			})
		})

		router.Use(cors.Handler(cors.Options{
			AllowedOrigins:   []string{"https://*", "http://*"},
			AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
			AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
			ExposedHeaders:   []string{"Link"},
			AllowCredentials: true,
			MaxAge:           300,
		}))
	}

	router.Mount("/api", ApiRouter())

	router.Get("/{tinyId}", func(w http.ResponseWriter, r *http.Request) {
		tinyId := chi.URLParam(r, "tinyId")

		uploadedFile, err := database.DB.UploadedFiles.FindRecordByTinyId(tinyId)
		if err != nil {
			slog.Error(err.Error())

			w.WriteHeader(http.StatusInternalServerError)

			return
		}

		if !services.UploadFilesManager.ValidateUploadFile(uploadedFile) {
			err := database.DB.UploadedFiles.DeleteRecordByTinyId(tinyId)
			if err != nil {
				slog.Error(err.Error())

				w.WriteHeader(http.StatusInternalServerError)

				return
			}

			w.WriteHeader(http.StatusNotFound)

			return
		}

		fileName, err := filenamify.Filenamify(uploadedFile.Name, filenamify.Options{Replacement: "_"})
		if err != nil {
			slog.Error(err.Error())

			w.WriteHeader(http.StatusInternalServerError)

			return
		}

		w.Header().Set("Content-Disposition", "attachment; filename="+fileName)

		slog.Debug(fmt.Sprintf("UploadedFile requested %s, downloads: %d, isSingleDownload: %t", tinyId, uploadedFile.DownloadsAmount+1, uploadedFile.IsSingleDownload))

		if uploadedFile.IsSingleDownload {
			err := database.DB.UploadedFiles.DeleteRecordByTinyId(tinyId)
			if err != nil {
				slog.Error(err.Error())

				w.WriteHeader(http.StatusInternalServerError)

				return
			}
		} else {
			err := database.DB.UploadedFiles.IncrementDownloadsAmountByTinyId(tinyId)
			if err != nil {
				slog.Error(err.Error())

				w.WriteHeader(http.StatusInternalServerError)

				return
			}
		}

		http.ServeFile(w, r, uploadedFile.Path)
	})

	homePageDirectory, err := filepath.Abs(os.Getenv("HOME_PAGE_DIRECTORY"))
	if err != nil {
		panic(err)
	}

	fs := http.FileServer(http.Dir(homePageDirectory))
	router.Handle("/*", fs)

	router.NotFound(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	})

	return router
}

func Start() {
	// https://stackoverflow.com/questions/55201561/golang-run-on-windows-without-deal-with-the-firewall

	portString := os.Getenv("PORT")
	port, parsePortError := strconv.ParseUint(portString, 10, 32)
	if parsePortError != nil {
		panic(fmt.Errorf("Bad port value: %s", portString))
	}
	if port <= 1000 {
		panic(fmt.Errorf("Port value must be more than 1000: %v", port))
	}

	serverUrl := fmt.Sprintf("localhost:%d", port)

	slog.Info("HTTP server running on http://" + serverUrl)

	http.ListenAndServe(serverUrl, mainRouter())
}

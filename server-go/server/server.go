package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/flytam/filenamify"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	uploadedfile "sharya-server/db/models"
	"sharya-server/tools"
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

	router.Use(cors.AllowAll().Handler)

	if tools.IsDevelopment {
		router.Use(middleware.Logger)
	}

	router.Mount("/api", ApiRouter())

	router.Get("/{tinyId}", func(w http.ResponseWriter, r *http.Request) {
		tinyId := chi.URLParam(r, "tinyId")

		uploadedFileRecord, _ := uploadedfile.FindRecordByTinyId(tinyId)
		if uploadedFileRecord == nil {
			w.WriteHeader(http.StatusNotFound)
		} else {
			fileName, _ := filenamify.Filenamify(uploadedFileRecord.Name, filenamify.Options{Replacement: "_"})

			w.Header().Set("Content-Disposition", "attachment; filename="+fileName)

			http.ServeFile(w, r, uploadedFileRecord.Path)
		}
	})

	homePageDirectory, _ := filepath.Abs(os.Getenv("HOME_PAGE_DIRECTORY"))
	fs := http.FileServer(http.Dir(homePageDirectory))
	router.Handle("/*", fs)

	router.NotFound(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	})

	return router
}

func StartServer() {
	// https://stackoverflow.com/questions/55201561/golang-run-on-windows-without-deal-with-the-firewall

	serverUrl := fmt.Sprintf("localhost:%s", os.Getenv("PORT"))
	fmt.Printf("Server running on: %s", serverUrl)

	http.ListenAndServe(serverUrl, mainRouter())
}

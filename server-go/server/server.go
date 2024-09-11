package server

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"sharya-server/tools"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func mainRouter() http.Handler {
	router := chi.NewRouter()

	router.Use(cors.AllowAll().Handler)

	if tools.IsDevelopment {
		router.Use(middleware.Logger)
	}

	router.Mount("/api", ApiRouter())

	homePageDirectory, _ := filepath.Abs(os.Getenv("HOME_PAGE_DIRECTORY"))
	fs := http.FileServer(http.Dir(homePageDirectory))
	// router.Handle("/static/*", http.StripPrefix("/static/", fs))
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

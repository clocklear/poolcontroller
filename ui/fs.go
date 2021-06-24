package ui

import (
	"embed"
	"io/fs"
	"net/http"
)

//go:embed build
var content embed.FS

func Handler() http.Handler {
	uifs, err := fs.Sub(content, "build")
	if err != nil {
		panic(err)
	}
	return http.FileServer(http.FS(uifs))
}

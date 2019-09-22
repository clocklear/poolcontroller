package main

import (
	"encoding/json"
	"net/http"
	"strconv"

	// "github.com/go-kit/kit/log"
	"github.com/clocklear/pirelayserver/cmd/pirelayserver/internal/relay"
	"github.com/gorilla/mux"
	// "github.com/robfig/cron/v3"
)

func okResponse(w http.ResponseWriter, payload interface{}) error {
	return jsonResponse(w, http.StatusOK, payload)
}

func jsonResponse(w http.ResponseWriter, status int, payload interface{}) error {
	b, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(b)
	return nil
}

func errorResponse(w http.ResponseWriter, err error) error {
	b := errResponse{
		Error: err.Error(),
	}
	return jsonResponse(w, http.StatusInternalServerError, b)
}

func getHandler(ctrl *relay.Controller) http.Handler {
	r := mux.NewRouter()
	r.HandleFunc("/", createHealthHandler(ctrl)).Methods("GET")
	r.HandleFunc("/relay/{relay}/toggle", createToggleHandler(ctrl)).Methods("POST")
	// r.HandleFunc("/schedules", getSchedules).Methods("GET")
	return r
}

func createHealthHandler(ctrl *relay.Controller) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		s, err := ctrl.Status()
		if err != nil {
			errorResponse(w, err)
			return
		}
		jsonResponse(w, http.StatusOK, s)
	}
}

func createToggleHandler(ctrl *relay.Controller) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		stridx := vars["relay"]
		idx, err := strconv.Atoi(stridx)
		if err != nil {
			errorResponse(w, err)
			return
		}
		err = ctrl.Toggle(uint8(idx))
		if err != nil {
			errorResponse(w, err)
			return
		}

		status, err := ctrl.Status()
		if err != nil {
			errorResponse(w, err)
			return
		}

		okResponse(w, status)
	}
}

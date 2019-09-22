package main

import (
	"encoding/json"
	"net/http"
	"strconv"

	// "github.com/go-kit/kit/log"
	"github.com/clocklear/pirelayserver/cmd/pirelayserver/internal/config"
	"github.com/clocklear/pirelayserver/cmd/pirelayserver/internal/relay"
	"github.com/gorilla/mux"
	uuid "github.com/satori/go.uuid"
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

func getHandler(cfger config.Configurer, ctrl *relay.Controller) http.Handler {
	r := mux.NewRouter()
	r.HandleFunc("/", createHealthHandler(ctrl)).Methods("GET")
	r.HandleFunc("/config", createGetConfigHandler(cfger)).Methods("GET")
	r.HandleFunc("/config/schedules", createAddScheduleHandler(cfger, ctrl)).Methods("POST")
	r.HandleFunc("/config/schedules/{id}", createRemoveScheduleHandler(cfger, ctrl)).Methods("DELETE")
	r.HandleFunc("/relay/{relay}/toggle", createToggleHandler(ctrl)).Methods("POST")

	return r
}

func createRemoveScheduleHandler(cfger config.Configurer, ctrl *relay.Controller) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id := vars["id"]

		// Find this schedule in the config
		cfg, err := cfger.Get()
		if err != nil {
			errorResponse(w, err)
			return
		}

		idx := -1
		for k, v := range cfg.Schedules {
			if v.ID == id {
				idx = k
			}
		}

		// Not found?
		if idx == -1 {
			jsonResponse(w, http.StatusNotFound, nil)
			return
		}

		// Splice this item out of the schedules
		cfg.Schedules = append(cfg.Schedules[:idx], cfg.Schedules[idx+1:]...)

		// Apply config, see if errors arise
		err = ctrl.ApplyConfig(cfg)
		if err != nil {
			errorResponse(w, err)
			return
		}

		// No errors?  Save the config
		err = cfger.Set(cfg)
		if err != nil {
			errorResponse(w, err)
			return
		}

		// Good to go!
		okResponse(w, nil)
	}
}

func createAddScheduleHandler(cfger config.Configurer, ctrl *relay.Controller) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		decoder := json.NewDecoder(r.Body)
		var s config.Schedule
		err := decoder.Decode(&s)
		if err != nil {
			errorResponse(w, err)
			return
		}

		// Set random ID on this schedule
		u := uuid.NewV4()
		s.ID = u.String()

		// Store this in the current config
		cfg, err := cfger.Get()
		if err != nil {
			errorResponse(w, err)
			return
		}
		cfg.Schedules = append(cfg.Schedules, s)

		// Apply config, see if errors arise
		err = ctrl.ApplyConfig(cfg)
		if err != nil {
			errorResponse(w, err)
			return
		}

		// No errors?  Save the config
		err = cfger.Set(cfg)
		if err != nil {
			errorResponse(w, err)
			return
		}

		// Good to go!
		okResponse(w, s)
	}
}

func createGetConfigHandler(cfger config.Configurer) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		cfg, err := cfger.Get()
		if err != nil {
			errorResponse(w, err)
			return
		}
		okResponse(w, cfg)
	}
}

func createHealthHandler(ctrl *relay.Controller) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		s, err := ctrl.Status()
		if err != nil {
			errorResponse(w, err)
			return
		}
		okResponse(w, s)
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

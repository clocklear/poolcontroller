package main

import (
	"encoding/json"
	"net/http"
	"strconv"

	// "github.com/go-kit/kit/log"
	"github.com/clocklear/pirelayserver/cmd/pirelayserver/internal"
	"github.com/gorilla/mux"
	uuid "github.com/satori/go.uuid"
)

func okResponse(w http.ResponseWriter, payload interface{}) error {
	if payload != nil {
		return jsonResponse(w, http.StatusOK, payload)
	}
	return jsonResponse(w, http.StatusNoContent, payload)
}

func jsonResponse(w http.ResponseWriter, status int, payload interface{}) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if payload != nil {
		b, err := json.Marshal(payload)
		if err != nil {
			return err
		}
		w.Write(b)
	}
	return nil
}

func errorResponse(w http.ResponseWriter, err error) error {
	b := errResponse{
		Error: err.Error(),
	}
	return jsonResponse(w, http.StatusInternalServerError, b)
}

func getHandler(cfger internal.Configurer, ctrl *internal.RelayController) http.Handler {
	r := mux.NewRouter()
	r.HandleFunc("/relays", healthHandler(ctrl)).Methods("GET")
	r.HandleFunc("/relays/{relay}/toggle", toggleHandler(ctrl)).Methods("POST")
	r.HandleFunc("/config", getConfigHandler(cfger)).Methods("GET")
	r.HandleFunc("/config/schedules", addScheduleHandler(cfger, ctrl)).Methods("POST")
	r.HandleFunc("/config/schedules/{id}", removeScheduleHandler(cfger, ctrl)).Methods("DELETE")

	return r
}

func removeScheduleHandler(cfger internal.Configurer, ctrl *internal.RelayController) func(http.ResponseWriter, *http.Request) {
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

func addScheduleHandler(cfger internal.Configurer, ctrl *internal.RelayController) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		decoder := json.NewDecoder(r.Body)
		var s internal.Schedule
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
		jsonResponse(w, http.StatusCreated, s)
	}
}

func getConfigHandler(cfger internal.Configurer) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		cfg, err := cfger.Get()
		if err != nil {
			errorResponse(w, err)
			return
		}
		okResponse(w, cfg)
	}
}

func healthHandler(ctrl *internal.RelayController) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		s, err := ctrl.Status()
		if err != nil {
			errorResponse(w, err)
			return
		}
		okResponse(w, s)
	}
}

func toggleHandler(ctrl *internal.RelayController) func(http.ResponseWriter, *http.Request) {
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

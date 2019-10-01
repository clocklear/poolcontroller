package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	// "github.com/go-kit/kit/log"
	"github.com/clocklear/pirelayserver/cmd/pirelayserver/internal"
	"github.com/gobuffalo/packr"
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

func getHandler(cfger internal.Configurer, ctrl *internal.RelayController, el *internal.EventLogger) http.Handler {
	r := mux.NewRouter()

	r.HandleFunc("/relays", relayStatusHandler(ctrl)).Methods(http.MethodGet)
	r.HandleFunc("/relays/{relay}/toggle", toggleRelayHandler(ctrl)).Methods(http.MethodPost)
	r.HandleFunc("/config", getConfigHandler(cfger)).Methods(http.MethodGet)
	r.HandleFunc("/config/schedules", addScheduleHandler(cfger, ctrl)).Methods(http.MethodPost)
	r.HandleFunc("/config/relay/{relay}/name", setRelayNameHandler(cfger, ctrl)).Methods(http.MethodPost)
	r.HandleFunc("/config/schedules/{id}", removeScheduleHandler(cfger, ctrl)).Methods(http.MethodDelete)
	r.HandleFunc("/events", getEventsHandler(el)).Methods(http.MethodGet)

	// Set up handler for web ui
	box := packr.NewBox("../../ui/build")
	r.PathPrefix("/").Handler(
		http.StripPrefix("/", http.FileServer(box)),
	)

	return r
}

func getEventsHandler(el *internal.EventLogger) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		e := el.Events()
		// Clone the slice
		b := make([]*internal.Event, len(e))
		copy(b, e)
		// Reverse the slice
		for i := len(b)/2 - 1; i >= 0; i-- {
			opp := len(b) - 1 - i
			b[i], b[opp] = b[opp], b[i]
		}
		okResponse(w, b)
		return
	}
}

type setRelayNameRequest struct {
	RelayName string `json:"relayName"`
}

func setRelayNameHandler(cfger internal.Configurer, ctrl *internal.RelayController) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		stridx := vars["relay"]
		idx, err := strconv.Atoi(stridx)
		if err != nil {
			errorResponse(w, err)
			return
		}
		if !ctrl.IsValidRelay(uint8(idx)) {
			errorResponse(w, fmt.Errorf("%v is an invalid relay", idx))
			return
		}

		decoder := json.NewDecoder(r.Body)
		var req setRelayNameRequest
		err = decoder.Decode(&req)
		if err != nil {
			errorResponse(w, err)
			return
		}

		cfg, err := cfger.Get()
		if err != nil {
			errorResponse(w, err)
			return
		}

		if cfg.RelayNames == nil {
			cfg.RelayNames = make(map[uint8]string)
		}
		cfg.RelayNames[uint8(idx)] = req.RelayName
		err = cfger.Set(cfg)
		if err != nil {
			errorResponse(w, err)
			return
		}

		okResponse(w, nil)
	}
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

		if s.ID == "" {
			// New schedule
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
		} else {
			// Existing schedule
			found := false
			idx := -1
			for k, v := range cfg.Schedules {
				if v.ID == s.ID {
					idx = k
					found = true
					break
				}
			}
			// Did we find this thing?  If not, 404.
			if !found {
				jsonResponse(w, http.StatusNotFound, nil)
				return
			}
			// Store this in the current config
			cfg, err := cfger.Get()
			if err != nil {
				errorResponse(w, err)
				return
			}
			// Replace the existing item in the cfg with our new one
			cfg.Schedules = append(cfg.Schedules[:idx], cfg.Schedules[idx+1:]..., s)
		}

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

func relayStatusHandler(ctrl *internal.RelayController) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		s, err := ctrl.Status()
		if err != nil {
			errorResponse(w, err)
			return
		}
		okResponse(w, s)
	}
}

func toggleRelayHandler(ctrl *internal.RelayController) func(http.ResponseWriter, *http.Request) {
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

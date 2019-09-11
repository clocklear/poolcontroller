package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/go-kit/kit/log"
	"github.com/gorilla/mux"
	"github.com/stianeikeland/go-rpio/v4"
)

const (
	pinRelay1 = 26
	pinRelay2 = 20
	pinRelay3 = 21
)

type status struct {
	RelayStates []relayState `json:"relayStates"`
}

type relayState struct {
	Relay int   `json:"relay"`
	State uint8 `json:"state"`
}

type errResponse struct {
	Error string `json:"error"`
}

func main() {

	// Config.
	var (
		httpAddr = flag.String("http.addr", ":3000", "HTTP listen address")
	)
	flag.Parse()

	// Logging.
	var logger log.Logger
	{
		logger = log.NewLogfmtLogger(os.Stderr)
		logger = log.With(logger, "ts", log.DefaultTimestampUTC)
		logger = log.With(logger, "caller", log.DefaultCaller)
	}

	// Mechanical.
	errc := make(chan error)
	_, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Interrupt.
	go func() {
		c := make(chan os.Signal, 1)
		signal.Notify(c, syscall.SIGINT, syscall.SIGTERM)
		errc <- fmt.Errorf("%s", <-c)
	}()

	// App.
	go func() {
		var srv http.Server

		logger := log.With(logger, "transport", "http")
		logger.Log("addr", *httpAddr)

		// Server config
		{
			srv.Addr = *httpAddr
			srv.Handler = getHandler()
			srv.ReadTimeout = time.Second * 30
			srv.WriteTimeout = time.Second * 30
		}

		errc <- srv.ListenAndServe()
	}()

	// Run.
	logger.Log("exit", <-errc)
}

func getHandler() http.Handler {
	r := mux.NewRouter()
	r.HandleFunc("/", healthHandler).Methods("GET")
	r.HandleFunc("/relay/{relay}/toggle", toggleHandler).Methods("POST")
	return r
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	s, err := getStatus()
	if err != nil {
		errorResponse(w, err)
		return
	}
	jsonResponse(w, http.StatusOK, s)
}

func toggleHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	stridx := vars["relay"]
	relays := getRelays()
	idx, err := strconv.Atoi(stridx)
	if err != nil {
		errorResponse(w, err)
		return
	}
	if idx < 1 || idx > len(relays) {
		errorResponse(w, fmt.Errorf("invalid relay. must be int between 1 and %v", len(relays)))
		return
	}
	if err := rpio.Open(); err != nil {
		errorResponse(w, err)
		return
	}
	pin := rpio.Pin(relays[idx-1])
	pin.Output()
	pin.Toggle()
	rpio.Close()

	status, err := getStatus()
	if err != nil {
		errorResponse(w, err)
		return
	}

	okResponse(w, status)
}

func getRelays() []int {
	return []int{pinRelay1, pinRelay2, pinRelay3}
}

func getStatus() (status, error) {
	r := status{}
	states := []relayState{}
	if err := rpio.Open(); err != nil {
		return r, err
	}
	defer rpio.Close()
	pins := getRelays()
	for k, v := range pins {
		pin := rpio.Pin(v)
		s := pin.Read()
		states = append(states, relayState{
			Relay: k + 1,
			State: uint8(s),
		})
	}
	r.RelayStates = states
	return r, nil
}

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

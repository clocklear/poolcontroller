package main

import (
	"context"
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/clocklear/pirelayserver/cmd/pirelayserver/internal"
	"github.com/go-kit/kit/log"
)

const (
	pinRelay1 = 26
	pinRelay2 = 20
	pinRelay3 = 21
)

type errResponse struct {
	Error string `json:"error"`
}

func main() {

	// Logging.
	var logger log.Logger
	{
		logger = log.NewLogfmtLogger(os.Stderr)
		logger = log.With(logger, "ts", log.DefaultTimestampUTC)
		logger = log.With(logger, "caller", log.DefaultCaller)
	}
	logger.Log("msg", "Server starting")

	// Config.
	var (
		httpAddr       = flag.String("http.addr", ":3000", "HTTP listen address")
		configFile     = flag.String("config.file", "config.json", "Configuration file")
		eventsFile     = flag.String("events.file", "events.csv", "Events log")
		devMode        = flag.Bool("dev", false, "When enabled, a stub relay implementation is used")
		eventsCapacity = flag.Int("events.capacity", 100, "Number of events to keep in events file")
	)
	flag.Parse()
	logger.Log("msg", "Parsed config")

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
	logger.Log("msg", "Set up interrupt")

	// Events logger
	el, err := internal.WithEventLogger(*eventsFile, uint16(*eventsCapacity))
	if err != nil {
		errc <- err
		return
	}
	logger.Log("msg", "Init events logger")

	// App.
	go func() {
		var srv http.Server
		logger.Log("addr", *httpAddr)

		// Configurer
		logger.Log("msg", "Init configurer")
		cfger, err := internal.WithJsonConfigurer(*configFile)
		if err != nil {
			errc <- err
			return
		}

		// Relay controller

		var ctrl internal.RelayController
		if *devMode {
			logger.Log("msg", "Dev mode, init stub relay controller")
			ctrl, err = internal.NewStubRelayController(logger, 3, cfger, el)
		} else {
			logger.Log("msg", "Init relay controller")
			ctrl, err = internal.NewPiRelayController(logger, []uint8{pinRelay1, pinRelay2, pinRelay3}, cfger, el)
		}
		if err != nil {
			errc <- err
			return
		}

		// Server config
		srv.Addr = *httpAddr
		srv.Handler = getHandler(cfger, ctrl, el)
		srv.ReadTimeout = time.Second * 30
		srv.WriteTimeout = time.Second * 30

		el.Log("Server booted up")
		logger.Log("msg", "Starting web app")

		errc <- srv.ListenAndServe()
	}()

	// Run.
	logger.Log("msg", "Transferring control to web app")
	logger.Log("exit", <-errc)
	el.Log("Server shutdown cleanly")
}

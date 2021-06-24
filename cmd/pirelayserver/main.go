package main

import (
	"context"
	"flag"
	"fmt"
	gosyslog "log/syslog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/clocklear/pirelayserver/cmd/pirelayserver/internal"
	"github.com/clocklear/pirelayserver/cmd/pirelayserver/internal/eventer"

	"github.com/go-kit/kit/log"
	"github.com/go-kit/kit/log/syslog"
	"github.com/joho/godotenv"
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

	// Config.
	var (
		httpAddr       = flag.String("http.addr", ":3000", "HTTP listen address")
		configFile     = flag.String("config.file", "config.json", "Configuration file")
		eventsFile     = flag.String("events.file", "events.csv", "Events log")
		devMode        = flag.Bool("dev", false, "When enabled, a stub relay implementation is used")
		sysLog         = flag.Bool("syslog", false, "When enabled, logging is routed to syslog")
		eventsCapacity = flag.Int("events.capacity", 100, "Number of events to keep in events file")
	)
	flag.Parse()

	// Logging.
	var logger log.Logger
	w, err := gosyslog.New(gosyslog.LOG_INFO, "poolcontroller")
	useSysLog := *sysLog
	if err != nil {
		fmt.Printf("failed to use syslog, falling back to stdout: %v\n", err)
		useSysLog = false
	}

	// syslog logger with logfmt formatting
	if useSysLog {
		logger = syslog.NewSyslogLogger(w, log.NewLogfmtLogger)
		fmt.Println("Server output routed to syslog")
	} else {
		logger = log.NewLogfmtLogger(os.Stderr)
	}
	logger = log.With(logger, "ts", log.DefaultTimestampUTC)
	logger = log.With(logger, "caller", log.DefaultCaller)
	logger.Log("msg", "Server starting")

	// .env
	err = godotenv.Load()
	if os.IsNotExist(err) {
		logger.Log("msg", "no .env found, skipping load")
	} else {
		if err != nil {
			logger.Log("err", err)
			os.Exit(1)
		}
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
	logger.Log("msg", "Set up interrupt")

	// Eventer
	el, err := eventer.WithCSVEventer(*eventsFile, uint16(*eventsCapacity))
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
		srv.Handler = getHandler(cfger, ctrl, el, logger)
		srv.ReadTimeout = time.Second * 30
		srv.WriteTimeout = time.Second * 30

		el.Event("Server booted up")
		logger.Log("msg", "Starting web app")

		errc <- srv.ListenAndServe()
	}()

	// Run.
	logger.Log("msg", "Transferring control to web app")
	logger.Log("exit", <-errc)
	el.Event("Server shutdown cleanly")
}

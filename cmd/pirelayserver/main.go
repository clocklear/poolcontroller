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

	// Config.
	var (
		httpAddr   = flag.String("http.addr", ":3000", "HTTP listen address")
		configFile = flag.String("config.file", "config.json", "Configuration file")
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
		logger.Log("addr", *httpAddr)

		// Configurer
		cfger, err := internal.WithJsonConfigurer(*configFile)
		if err != nil {
			errc <- err
		}

		// Relay controller
		ctrl, err := internal.NewRelayController(logger, []uint8{pinRelay1, pinRelay2, pinRelay3}, cfger)
		if err != nil {
			errc <- err
		}

		// Server config
		srv.Addr = *httpAddr
		srv.Handler = getHandler(cfger, ctrl)
		srv.ReadTimeout = time.Second * 30
		srv.WriteTimeout = time.Second * 30

		errc <- srv.ListenAndServe()
	}()

	// Run.
	logger.Log("exit", <-errc)
}

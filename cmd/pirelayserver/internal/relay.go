package internal

import (
	"fmt"

	"github.com/go-kit/kit/log"
	"github.com/robfig/cron/v3"
	"github.com/stianeikeland/go-rpio/v4"
)

type RelayController struct {
	relayPins []uint8
	scheduler *cron.Cron
	logger    log.Logger
	cfger     Configurer
	el        *EventLogger
}

func NewRelayController(l log.Logger, relayPins []uint8, cfger Configurer, el *EventLogger) (*RelayController, error) {
	c := RelayController{
		relayPins: relayPins,
		logger:    l,
		scheduler: cron.New(),
		cfger:     cfger,
		el:        el,
	}
	cfg, err := cfger.Get()
	if err != nil {
		return nil, err
	}
	err = c.ApplyConfig(cfg)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (c *RelayController) ApplyConfig(cfg Config) error {
	// Handle schedules
	c.scheduler.Stop()
	c.clearScheduler()
	for _, s := range cfg.Schedules {
		f := c.createToggleFunction(s.Relay, s.Action, "scheduled action")
		_, err := c.scheduler.AddFunc(s.Expression, f)
		if err != nil {
			return err
		}
	}
	c.scheduler.Start()
	return nil
}

func (c *RelayController) clearScheduler() {
	for _, e := range c.scheduler.Entries() {
		c.scheduler.Remove(e.ID)
	}
}

func (c *RelayController) createToggleFunction(relay uint8, action Action, cause string) func() {
	ret := func() {}
	switch action {
	case On:
		ret = func() {
			c.logger.Log("msg", "Switching relay to On", "relay", relay, "cause", cause)
			c.On(relay, cause)
		}
	case Off:
		ret = func() {
			c.logger.Log("msg", "Switching relay to Off", "relay", relay, "cause", cause)
			c.Off(relay, cause)
		}
	}
	return ret
}

func (c *RelayController) Status() (Status, error) {
	r := Status{}
	states := []State{}
	if err := rpio.Open(); err != nil {
		return r, err
	}
	defer rpio.Close()
	for k, v := range c.relayPins {
		rly := uint8(k) + 1
		// don't care about error here, because func gives a fallback
		n, _ := c.relayName(rly)
		pin := rpio.Pin(v)
		s := pin.Read()
		states = append(states, State{
			Relay: rly,
			State: uint8(s),
			Name:  n,
		})
	}
	r.States = states
	return r, nil
}

func (c *RelayController) relayName(relay uint8) (string, error) {
	name := fmt.Sprintf("Relay %v", relay)
	cfg, err := c.cfger.Get()
	if err != nil {
		return name, err
	}
	if v, ok := cfg.RelayNames[relay]; ok {
		name = v
	}
	return name, nil
}

func (c *RelayController) IsValidRelay(relay uint8) bool {
	return int(relay) <= len(c.relayPins)
}

func (c *RelayController) Toggle(relay uint8) error {
	if !c.IsValidRelay(relay) {
		return fmt.Errorf("invalid relay. must be uint between 1 and %v", len(c.relayPins))
	}
	if err := rpio.Open(); err != nil {
		return err
	}
	defer rpio.Close()
	pin := rpio.Pin(c.relayPins[relay-1])
	pin.Output()
	pin.Toggle()
	s := pin.Read()
	ss := "off"
	if int(s) == 1 {
		ss = "on"
	}
	n, _ := c.relayName(relay)
	c.el.Log(fmt.Sprintf("Toggled '%v' (relay %v), new state is %v", n, relay, ss))
	return nil
}

func (c *RelayController) On(relay uint8, cause string) error {
	if int(relay) > len(c.relayPins) {
		return fmt.Errorf("invalid relay. must be uint between 1 and %v", len(c.relayPins))
	}
	if err := rpio.Open(); err != nil {
		return err
	}
	defer rpio.Close()
	pin := rpio.Pin(c.relayPins[relay-1])
	pin.Output()
	pin.High()
	n, _ := c.relayName(relay)
	c.el.Log(fmt.Sprintf("Switching '%v' (relay %v) on, cause: %v", n, relay, cause))
	return nil
}

func (c *RelayController) Off(relay uint8, cause string) error {
	if int(relay) > len(c.relayPins) {
		return fmt.Errorf("invalid relay. must be uint between 1 and %v", len(c.relayPins))
	}
	if err := rpio.Open(); err != nil {
		return err
	}
	defer rpio.Close()
	pin := rpio.Pin(c.relayPins[relay-1])
	pin.Output()
	pin.Low()
	n, _ := c.relayName(relay)
	c.el.Log(fmt.Sprintf("Switching '%v' (relay %v) on, cause: %v", n, relay, cause))
	return nil
}

package internal

import (
	"fmt"

	"github.com/go-kit/kit/log"
	"github.com/robfig/cron/v3"
	"github.com/stianeikeland/go-rpio/v4"
)

type PiRelayController struct {
	relayPins []uint8
	scheduler *cron.Cron
	logger    log.Logger
	cfger     Configurer
	el        *EventLogger
}

func NewPiRelayController(l log.Logger, relayPins []uint8, cfger Configurer, el *EventLogger) (*PiRelayController, error) {
	c := PiRelayController{
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

func (c *PiRelayController) ApplyConfig(cfg Config) error {
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

func (c *PiRelayController) clearScheduler() {
	for _, e := range c.scheduler.Entries() {
		c.scheduler.Remove(e.ID)
	}
}

func (c *PiRelayController) createToggleFunction(relay uint8, action Action, cause string) func() {
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

func (c *PiRelayController) Status() (Status, error) {
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

func (c *PiRelayController) relayName(relay uint8) (string, error) {
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

func (c *PiRelayController) IsValidRelay(relay uint8) bool {
	return int(relay) <= len(c.relayPins)
}

func (c *PiRelayController) Toggle(relay uint8) error {
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

func (c *PiRelayController) On(relay uint8, cause string) error {
	if !c.IsValidRelay(relay) {
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

func (c *PiRelayController) Off(relay uint8, cause string) error {
	if !c.IsValidRelay(relay) {
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
	c.el.Log(fmt.Sprintf("Switching '%v' (relay %v) off, cause: %v", n, relay, cause))
	return nil
}

package relay

import (
	"fmt"

	"github.com/clocklear/pirelayserver/cmd/pirelayserver/internal/config"
	"github.com/go-kit/kit/log"
	"github.com/robfig/cron/v3"
	"github.com/stianeikeland/go-rpio/v4"
)

type State struct {
	Relay uint8 `json:"relay"`
	State uint8 `json:"state"`
}

type Status struct {
	States []State `json:"relayStates"`
}

type Controller struct {
	relayPins []uint8
	scheduler *cron.Cron
	logger    log.Logger
}

func NewController(l log.Logger, relayPins []uint8, cfg config.Config) (*Controller, error) {
	c := Controller{
		relayPins: relayPins,
		logger:    l,
		scheduler: cron.New(),
	}
	err := c.ApplyConfig(cfg)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (c *Controller) ApplyConfig(cfg config.Config) error {
	// Handle schedules
	// TODO: Might want to wait for returned context to complete
	c.scheduler.Stop()
	c.clearScheduler()
	for _, s := range cfg.Schedules {
		f := c.createToggleFunction(s.Relay, s.Action)
		_, err := c.scheduler.AddFunc(s.Expression, f)
		if err != nil {
			return err
		}
	}
	c.scheduler.Start()
	return nil
}

func (c *Controller) clearScheduler() {
	for _, e := range c.scheduler.Entries() {
		c.scheduler.Remove(e.ID)
	}
}

func (c *Controller) createToggleFunction(relay uint8, action config.Action) func() {
	ret := func() {}
	switch action {
	case config.On:
		ret = func() {
			c.logger.Log("msg", "Switching relay to On", "relay", relay)
			c.On(relay)
		}
	case config.Off:
		ret = func() {
			c.logger.Log("msg", "Switching relay to Off", "relay", relay)
			c.Off(relay)
		}
	}
	return ret
}

func (c *Controller) Status() (Status, error) {
	r := Status{}
	states := []State{}
	if err := rpio.Open(); err != nil {
		return r, err
	}
	defer rpio.Close()
	for k, v := range c.relayPins {
		pin := rpio.Pin(v)
		s := pin.Read()
		states = append(states, State{
			Relay: uint8(k) + 1,
			State: uint8(s),
		})
	}
	r.States = states
	return r, nil
}

func (c *Controller) Toggle(relay uint8) error {
	if int(relay) > len(c.relayPins) {
		return fmt.Errorf("invalid relay. must be uint between 1 and %v", len(c.relayPins))
	}
	if err := rpio.Open(); err != nil {
		return err
	}
	defer rpio.Close()
	pin := rpio.Pin(c.relayPins[relay-1])
	pin.Output()
	pin.Toggle()
	return nil
}

func (c *Controller) On(relay uint8) error {
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
	return nil
}

func (c *Controller) Off(relay uint8) error {
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
	return nil
}

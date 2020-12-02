package internal

import (
	"fmt"
	"sort"
	"sync"

	"github.com/go-kit/kit/log"
	"github.com/robfig/cron/v3"

	"github.com/clocklear/pirelayserver/cmd/pirelayserver/internal/eventer"
)

type StubRelayController struct {
	logger      log.Logger
	cfger       Configurer
	el          eventer.Eventer
	scheduler   *cron.Cron
	relayStates map[uint8]bool
	m           sync.RWMutex
}

func NewStubRelayController(l log.Logger, numRelays uint8, cfger Configurer, el eventer.Eventer) (*StubRelayController, error) {
	// Init stub controller
	c := StubRelayController{
		logger:    l,
		cfger:     cfger,
		el:        el,
		scheduler: cron.New(),
		m:         sync.RWMutex{},
	}
	// Create relay states map
	rs := make(map[uint8]bool)
	for i := uint8(0); i < numRelays; i++ {
		rs[i] = false
	}
	c.relayStates = rs
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

func (c *StubRelayController) ApplyConfig(cfg Config) error {
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

func (c *StubRelayController) clearScheduler() {
	for _, e := range c.scheduler.Entries() {
		c.scheduler.Remove(e.ID)
	}
}

func (c *StubRelayController) createToggleFunction(relay uint8, action Action, cause string) func() {
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

func (c *StubRelayController) Status() (Status, error) {
	r := Status{}
	states := []State{}
	c.m.RLock()
	defer c.m.RUnlock()
	// Iterating maps doesn't return a defined order, so we need to collect
	// the keys, sort them, and then iterate the map by key
	keys := []int{}
	for k := range c.relayStates {
		keys = append(keys, int(k))
	}
	sort.Ints(keys)
	for _, k := range keys {
		v := c.relayStates[uint8(k)]
		rly := uint8(k) + 1
		// don't care about error here, because func gives a fallback
		n, _ := c.relayName(rly)
		state := uint8(0)
		if v {
			state = uint8(1)
		}
		states = append(states, State{
			Relay: rly,
			State: state,
			Name:  n,
		})
	}
	r.States = states
	return r, nil
}

func (c *StubRelayController) relayName(relay uint8) (string, error) {
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

func (c *StubRelayController) IsValidRelay(relay uint8) bool {
	return int(relay) <= len(c.relayStates)
}

func (c *StubRelayController) Toggle(relay uint8) error {
	if !c.IsValidRelay(relay) {
		return fmt.Errorf("invalid relay. must be uint between 1 and %v", len(c.relayStates))
	}
	c.m.Lock()
	v := !c.relayStates[relay-1]
	c.relayStates[relay-1] = v
	c.m.Unlock()
	ss := "off"
	if v {
		ss = "on"
	}
	n, _ := c.relayName(relay)
	c.el.Event(fmt.Sprintf("Toggled '%v' (relay %v), new state is %v", n, relay, ss))
	return nil
}

func (c *StubRelayController) On(relay uint8, cause string) error {
	if !c.IsValidRelay(relay) {
		return fmt.Errorf("invalid relay. must be uint between 1 and %v", len(c.relayStates))
	}
	c.m.Lock()
	c.relayStates[relay-1] = true
	c.m.Unlock()
	n, _ := c.relayName(relay)
	c.el.Event(fmt.Sprintf("Switching '%v' (relay %v) on, cause: %v", n, relay, cause))
	return nil
}

func (c *StubRelayController) Off(relay uint8, cause string) error {
	if !c.IsValidRelay(relay) {
		return fmt.Errorf("invalid relay. must be uint between 1 and %v", len(c.relayStates))
	}
	c.m.Lock()
	c.relayStates[relay-1] = false
	c.m.Unlock()
	n, _ := c.relayName(relay)
	c.el.Event(fmt.Sprintf("Switching '%v' (relay %v) off, cause: %v", n, relay, cause))
	return nil
}

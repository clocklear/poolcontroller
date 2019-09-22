package relay

import (
	"fmt"

	"github.com/stianeikeland/go-rpio/v4"
)

type State struct {
	Relay int   `json:"relay"`
	State uint8 `json:"state"`
}

type Status struct {
	States []State `json:"relayStates"`
}

type Controller struct {
	relayPins []uint8
}

func NewController(relayPins []uint8) *Controller {
	c := Controller{
		relayPins: relayPins,
	}
	return &c
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
			Relay: k + 1,
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

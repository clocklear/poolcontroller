//go:generate mockgen -destination=./mocks/mock_configurer.go -package=mocks github.com/clocklear/pirelayserver/cmd/pirelayserver/internal Configurer

package internal

import (
	"encoding/json"
	"io/ioutil"
	"os"
)

type Action string

const (
	Off Action = "off"
	On  Action = "on"
)

// Config is a pirelayserver config
type Config struct {
	Schedules  []Schedule `json:"schedules"`
	LastStatus Status     `json:"lastStatus"`
}

// Schedule is a mapping of a relay action along with a cron expression
type Schedule struct {
	ID         string `json:"id"`
	Relay      uint8  `json:"relay"`
	Expression string `json:"expression"`
	Action     Action `json:"action"`
}

type State struct {
	Relay uint8 `json:"relay"`
	State uint8 `json:"state"`
}

type Status struct {
	States []State `json:"relayStates"`
}

// Configurer describes an interface for retrieving and storing a config
type Configurer interface {
	Get() (Config, error)
	Set(Config) error
}

// JsonConfigurer is a Configurer implementation backed by a JSON file
type JsonConfigurer struct {
	filename string
}

func WithJsonConfigurer(filename string) (Configurer, error) {
	c := JsonConfigurer{
		filename: filename,
	}
	_, err := os.Stat(filename)
	if os.IsNotExist(err) {
		// Create a blank config and persist it
		err = c.Set(Config{})
		if err != nil {
			return nil, err
		}
	}

	return &c, nil
}

// Get the config
func (c *JsonConfigurer) Get() (Config, error) {
	cfg := Config{}
	dat, err := ioutil.ReadFile(c.filename)
	if err != nil {
		return cfg, err
	}
	err = json.Unmarshal(dat, &cfg)
	return cfg, err
}

// Set the config
func (c *JsonConfigurer) Set(cfg Config) error {
	dat, err := json.Marshal(cfg)
	if err != nil {
		return err
	}
	return ioutil.WriteFile(c.filename, dat, 0644)
}

package config

import (
	"encoding/json"
	"io/ioutil"
	"os"
)

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

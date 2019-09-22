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
	_, err := os.Stat(filename)
	if os.IsNotExist(err) {
		return nil, err
	}
	c := JsonConfigurer{
		filename: filename,
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

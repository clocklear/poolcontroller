//go:generate mockgen -destination=../mocks/mock_configurer.go -package=mocks github.com/clocklear/pirelayserver/cmd/pirelayserver/internal/config Configurer

package config

type Action string

const (
	Off Action = "off"
	On  Action = "on"
)

// Configurer describes an interface for retrieving and storing a config
type Configurer interface {
	Get() (Config, error)
	Set(Config) error
}

// Config is a pirelayserver config
type Config struct {
	Schedules []Schedule `json:"schedules"`
}

// Schedule is a mapping of a relay action along with a cron expression
type Schedule struct {
	ID         string `json:"id"`
	Relay      uint8  `json:"relay"`
	Expression string `json:"expression"`
	Action     Action `json:"action"`
}

//go:generate mockgen -destination=../mocks/mock_configurer.go -package=mocks github.com/clocklear/pirelayserver/cmd/pirelayserver/internal/config Configurer

package config

// Configurer describes an interface for retrieving and storing a config
type Configurer interface {
	Get() (Config, error)
	Set(Config) error
}

// Config is a pirelayserver config
type Config struct {
	Schedules []string
}

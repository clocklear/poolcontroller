package internal

// RelayController represents the control surface that relay controller must
// implement to be used by the service
type RelayController interface {
	ApplyConfig(cfg Config) error
	IsValidRelay(relay uint8) bool
	Status() (Status, error)
	Toggle(relay uint8) error
	On(relay uint8, cause string) error
	Off(relay uint8, cause string) error
}

package eventer

import (
	"time"
)

type Event struct {
	Stamp time.Time `csv:"stamp" json:"stamp"`
	Msg   string    `csv:"msg" json:"msg"`
}

type Eventer interface {
	Event(msg string) error
	ListAll() ([]Event, error)
}

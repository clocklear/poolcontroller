package internal

import (
	"os"
	"strings"
	"time"

	"github.com/gocarina/gocsv"
)

type Event struct {
	Stamp time.Time `csv:"stamp" json:"stamp"`
	Msg   string    `csv:"msg" json:"msg"`
}

type EventLogger struct {
	filename string
	events   []*Event
	capacity uint16
}

func WithEventLogger(filename string, capacity uint16) (*EventLogger, error) {
	// Load our file, parse the contents, put it in memory
	eventsFile, err := os.OpenFile(filename, os.O_RDWR|os.O_CREATE, os.ModePerm)
	if err != nil {
		return nil, err
	}
	defer eventsFile.Close()

	el := EventLogger{
		filename: filename,
		capacity: capacity,
		events:   make([]*Event, 0),
	}

	if err := gocsv.UnmarshalFile(eventsFile, &el.events); err != nil {
		if !strings.Contains(err.Error(), "empty csv") {
			return nil, err
		}
	}

	return &el, nil
}

func (l *EventLogger) Log(msg string) error {
	e := Event{
		Stamp: time.Now(),
		Msg:   msg,
	}
	// Append to slice
	l.events = append(l.events, &e)
	// Prune
	if len(l.events) > int(l.capacity) {
		l.events = l.events[:len(l.events)-1]
	}
	// Write
	eventsFile, err := os.OpenFile(l.filename, os.O_RDWR|os.O_CREATE, os.ModePerm)
	if err != nil {
		return err
	}
	defer eventsFile.Close()
	return gocsv.MarshalFile(&l.events, eventsFile)
}

func (l *EventLogger) Events() []*Event {
	return l.events
}

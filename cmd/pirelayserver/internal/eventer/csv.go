package eventer

import (
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gocarina/gocsv"
)

type CSVEventer struct {
	filename string
	events   []Event
	capacity uint16
	m        *sync.RWMutex
}

func WithCSVEventer(filename string, capacity uint16) (Eventer, error) {
	// Load our file, parse the contents, put it in memory
	eventsFile, err := os.OpenFile(filename, os.O_RDWR|os.O_CREATE, os.ModePerm)
	if err != nil {
		return nil, err
	}
	defer eventsFile.Close()

	el := CSVEventer{
		filename: filename,
		capacity: capacity,
		events:   make([]Event, 0),
		m:        &sync.RWMutex{},
	}

	if err := gocsv.UnmarshalFile(eventsFile, &el.events); err != nil {
		if !strings.Contains(err.Error(), "empty csv") {
			return nil, err
		}
	}

	return &el, nil
}

func (l *CSVEventer) Event(msg string) error {
	e := Event{
		Stamp: time.Now(),
		Msg:   msg,
	}
	// Append to slice
	l.m.Lock()
	defer l.m.Unlock()
	l.events = append(l.events, e)
	// Prune
	if len(l.events) > int(l.capacity) {
		// Take the back <l.capacity> events from the slice
		l.events = l.events[len(l.events)-int(l.capacity):]
	}
	// Write
	eventsFile, err := os.OpenFile(l.filename, os.O_RDWR|os.O_CREATE, os.ModePerm)
	if err != nil {
		return err
	}
	defer eventsFile.Close()
	return gocsv.MarshalFile(&l.events, eventsFile)
}

func (l *CSVEventer) ListAll() ([]Event, error) {
	l.m.RLock()
	defer l.m.RUnlock()
	return l.events, nil
}

build:
	GOOS=linux GOARCH=arm GOARM=7 go build ./cmd/pirelayserver

.PHONY: build
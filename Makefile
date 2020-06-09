PI=10.1.0.5

ui:
	cd ./ui && yarn build

pirelayserver:
	GOOS=linux GOARCH=arm GOARM=7 packr build ./cmd/pirelayserver

build: ui pirelayserver
	
deploy:	
	ssh -t pi@${PI} 'sudo service pirelayserver stop'
	scp ./pirelayserver pi@${PI}:/opt/pirelayserver/pirelayserver
	ssh -t pi@${PI} 'sudo service pirelayserver start'

release: build deploy

.PHONY: build deploy ui pirelayserver release
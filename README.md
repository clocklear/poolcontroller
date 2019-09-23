# pirelayserver

This project exposes a Go web service that is meant to be used to control a relay extension board on a Raspberry Pi ([this extension board, to be exact](https://www.amazon.com/gp/product/B07CZL2SKN)).

## background and overview

I have a swimming pool controller with a physical timer that controls whether the pool pump and chlorinator are running.  I wanted to bring my pool into the 21st century so that I could monitor whether the equipment was running or not, when it last ran, and maybe toggle its functionality remotely.  After lots of searching through commercial options and finding they are grossly overpriced, I decided to investigate what would be necessary to build my own internet-enabled pool controller.  Poking around in my existing pool controller, I found it would be possible to use a Raspberry Pi to drive the circuitry, bypassing the mechanical timer with my own 'smart timer'.  This project forms the brains of the operation.

Most of the power of this project lies in the ability to schedule relay actions.  You can have any relay perform any action (as long as it's `on` or `off`) at any arbitrary time of your choosing.  The service provides an endpoint for creating schedules and can fire on any stardard cron syntax (along with some nonstandard ones).  I used the wonderful [robfig/cron package](https://godoc.org/github.com/robfig/cron) for scheduling, so you can use any syntax that library supports.  You can also create as many schedules as you like, although I've taken no special precautions to ensure that schedules do not thrash one another.  You're on your own there.

### features

* Allows for manually reading and toggling current relay states
* Allows for scheduling of relay actions with cron syntax
* Persistent configuration; created configuration survives service restarts
* Sample `systemd` unit file for creating service inside Raspbian

## service endpoints

### `GET /relays`

Returns the current status of the relays.

#### example response:

```
{
    "relayStates": [
        {
            "relay": 1,
            "state": 0
        },
        {
            "relay": 2,
            "state": 0
        },
        {
            "relay": 3,
            "state": 0
        }
    ]
}
```

### `POST /relays/{relay}/toggle`

Toggles the given relay (selected by `1`, `2`, or `3`).  Response is the current state of all relays (similar to above).

### `GET /config`

Returns the contents of the current configuration.

#### example response:

```
{
    "schedules": [
        {
            "id": "02eae795-31a9-4b05-85c6-837fb00a378c",
            "relay": 1,
            "expression": "0 0 * * *",
            "action": "on"
        },
        {
            "id": "fe857123-fc82-43a3-a030-101d9757bc82",
            "relay": 1,
            "expression": "0 8 * * *",
            "action": "off"
        }
    ]
}
```

### `POST /config/schedules`

Creates a new schedule entry.  The schedule should have following JSON syntax:

| property | *description* |
|----|-----|
| relay | Logical relay number to control (usually 1 to n) |
| expression | Cron expression the action should be triggered on |
| action | Action to perform.  Current valid actions are `off` and `on`. |

A `201 Created` response indicates the schedule was accepted and applied.  All other responses are failures.

#### example response

```
{
    "id": "fe857123-fc82-43a3-a030-101d9757bc82",
    "relay": 1,
    "expression": "0 8 * * *",
    "action": "off"
}
```

The `id` is a uuid assigned to the schedule automatically that can be used to remove the schedule if desired.

### `DELETE /config/schedules/{id}`

Removes the given schedule entry.  If the `id` provided is invalid, a `404 Not Found` will be returned.  A `204 No Content` response indicates success.

## building and running

Clone the repo, edit the code, then `make build` to rebuild for Raspberry Pi.  The `build` make target explicitly targets Pi 3+; if you are using an older Pi, try `GOARM=6`.  `scp` the file to your Pi, then execute the binary.  The service appears on port `3000` by default; you can override it with the `--http.addr` flag.

## the future

Eventually there will be a web UI for interacting with the API.  Maybe I'll also integrate AWS services (lightly) to allow for CloudWatch alerts on failures?
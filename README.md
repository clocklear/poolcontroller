# pool controller

This project exposes a React SPA atop a Go web service that controls a relay extension board on a Raspberry Pi ([this extension board, to be exact](https://www.amazon.com/gp/product/B07CZL2SKN)).  I use it to automate my pool equipment.

## background and overview

I have a swimming pool controller with a physical timer that controls whether the pool pump and chlorinator are running.  I wanted to bring my pool into the 21st century so that I could monitor whether the equipment was running or not, when it last ran, and maybe toggle its functionality remotely.  After lots of searching through commercial options and finding they are grossly overpriced, I decided to investigate what would be necessary to build my own internet-enabled pool controller.  Poking around in my existing pool controller, I found it would be possible to use a Raspberry Pi to drive the circuitry, bypassing the mechanical timer with my own 'smart timer'.  This project forms the brains of the operation.

Most of the power of this project lies in the ability to schedule relay actions.  You can have any relay perform any action (as long as it's `on` or `off`) at any arbitrary time of your choosing.  The service provides an endpoint for creating schedules and can fire on any stardard cron syntax (along with some nonstandard ones).  I used the wonderful [robfig/cron package](https://godoc.org/github.com/robfig/cron) for scheduling, so you can use any syntax that library supports.  You can also create as many schedules as you like, although I've taken no special precautions to ensure that schedules do not thrash one another.  You're on your own there.

### features

* Allows for manually reading and toggling current relay states
* Allows for scheduling of relay actions with cron syntax
* Persistent configuration; created configuration survives service restarts
* Sample `systemd` unit file for creating service inside Raspbian
* React SPA provided with full Auth0 support

## service endpoints

### `GET /api/relays`

Returns the current status of the relays.

**example response:**

```json
{
    "relayStates": [
        {
            "name": "Relay 1",
            "relay": 1,
            "state": 0
        },
        {
            "name": "Relay 2",
            "relay": 2,
            "state": 0
        },
        {
            "name": "Relay 3",
            "relay": 3,
            "state": 0
        }
    ]
}
```

### `POST /api/config/relay/{relay}/name`

Allows for changing of a given relay name.  A `204 No Content` status code indicates success; all other responses are failures.

**sample request:**

```json
{
    "relayName": "Pool Pump"
}
```

### `POST /api/relays/{relay}/toggle`

Toggles the given relay (selected by `1`, `2`, or `3`).  Response is the current state of all relays (similar to above).

### `GET /api/config`

Returns the contents of the current configuration.

**example response:**

```json
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

### `POST /api/config/schedules`

Creates a new schedule entry.  The schedule should have following JSON syntax:

| property   | *description*                                                 |
|------------|---------------------------------------------------------------|
| relay      | Logical relay number to control (usually 1 to n)              |
| expression | Cron expression the action should be triggered on             |
| action     | Action to perform.  Current valid actions are `off` and `on`. |

A `201 Created` response indicates the schedule was accepted and applied.  All other responses are failures.

**example response:**

```json
{
    "id": "fe857123-fc82-43a3-a030-101d9757bc82",
    "relay": 1,
    "expression": "0 8 * * *",
    "action": "off"
}
```

The `id` is a uuid assigned to the schedule automatically that can be used to remove the schedule if desired.

### `DELETE /api/config/schedules/{id}`

Removes the given schedule entry.  If the `id` provided is invalid, a `404 Not Found` will be returned.  A `204 No Content` response indicates success.

## building and running

### required environment variables and config

Because of the integration with Auth0, the Go service expects to be started with a few environment variables:

* `AUTH0_AUDIENCE` -- the identifier of the API you are targeting.  I use this for my different environments to ensure dev creds don't work in prod (and vice versa).
* `AUTH0_CALLBACK_URL` -- the callback value you have set up for your Auth0 app.
* `AUTH0_CLIENT_ID` -- the client ID of your Auth0 app
* `AUTH0_CLIENT_SECRET` -- the client secret of your Auth0 app
* `AUTH0_DOMAIN` -- your Auth0 tenant URL (sans protocal, e.g. `lockleartech.auth0.com`)

You should also edit `ui/modules/config/index.js` and replace the `auth0` values there with values appropriate for your environment.

### development

The SPA can be started in development mode by changing to the `ui` directory and running `yarn start`.  The app will be started on `:3001` and will expect to find the Go service running on `:3000` (the react development server has been configured to proxy API requests to this port).  To launch the Go service in development mode, just `go run cmd/pirelayserver --dev=true`.  This enables a stub relay controller implementation that allows the service and SPA to function, but doesn't require
the pi or relay hardware.

### building a release

Clone the repo, edit the code, then `make build` to rebuild for Raspberry Pi.  The `build` make target explicitly targets Pi 3+; if you are using an older Pi, try `GOARM=6`.  `scp` the file to your Pi, then execute the binary.  The service appears on port `3000` by default; you can override it with the `--http.addr` flag.

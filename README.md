# pirelayserver

This project exposes a Go web service that is meant to be used to control a relay extension board on a Raspberry Pi ([this extension board, to be exact](https://www.amazon.com/gp/product/B07CZL2SKN)).

## endpoints

### `GET /`

Returns the current status of the three relays.

example response:

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

### `POST /relay/{relay}/toggle`

Toggles the given relay (selected by `1`, `2`, or `3`).  Response is the current state of all relays (similar to above).

## building and running

Clone the repo, edit the code, then `make build` to rebuild for Raspberry Pi.  The `build` make target explicitly targets Pi 3+; if you are using an older Pi, try `GOARM=6`.  `scp` the file to your Pi, then execute the binary.  The service appears on port `3000` by default; you can override it with the `--http.addr` flag.
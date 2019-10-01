const states = {
  production: {
    isLoading: true,
    relays: [],
    activity: [],
    schedules: [],
    scheduleDialogIsOpen: false,
    editedSchedule: {},
    removeScheduleDialogIsOpen: false,
    scheduleDialogIntent: "",
    removeScheduleId: 0,
  },
  development: {
    removeScheduleId: 0,
    removeScheduleDialogIsOpen: false,
    editedSchedule: {},
    scheduleDialogIsOpen: false,
    scheduleDialogIntent: "",
    isLoading: false,
    relays: [{
        "relay": 1,
        "name": "Relay 1",
        "state": 0
      },
      {
        "relay": 2,
        "name": "Relay 2",
        "state": 1
      },
      {
        "relay": 3,
        "name": "Arbitrarily Named Relay",
        "state": 0
      }
    ],
    activity: [{
        "stamp": "2019-09-26T21:09:15.043992-04:00",
        "msg": "pirelayserver booted up"
      },
      {
        "stamp": "2019-09-26T21:09:50.32457-04:00",
        "msg": "pirelayserver booted up"
      },
      {
        "stamp": "2019-09-26T21:31:37.038862-04:00",
        "msg": "pirelayserver booted up"
      },
      {
        "stamp": "2019-09-26T21:31:38.666961-04:00",
        "msg": "pirelayserver shut down cleanly"
      },
      {
        "stamp": "2019-09-26T21:31:44.043208-04:00",
        "msg": "pirelayserver booted up"
      }
    ],
    schedules: [{
        "id": "7f7d706a-db3e-417e-a5bd-a43fd8b76cb6",
        "relay": 2,
        "expression": "0 8 * * *",
        "action": "off"
      },
      {
        "id": "67dd9103-1cb8-4830-89c4-17aaec3918a9",
        "relay": 1,
        "expression": "0 0 * * *",
        "action": "on"
      }
    ]
  }
}

export default states[process.env.NODE_ENV];

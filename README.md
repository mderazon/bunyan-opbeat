# bunyan-opbeat

> Bunyan stream for [Opbeat](https://opbeat.com)

[![Build Status](https://travis-ci.org/mderazon/bunyan-opbeat.svg?branch=master)](https://travis-ci.org/mderazon/bunyan-opbeat)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)


## Install

``` sh
# install bunyan
$ npm i --save bunyan

# install bunyan-opbeat
$ npm i --save bunyan-opbeat
```

### Use
``` js
var bunyan = require('bunyan')
var BunyanOpbeat = require('bunyan-opbeat')

var log = bunyan.createLogger({
  name: 'my-logger',
  streams: [
    {
      level: 'warn',
      type: 'raw', // <-- this is mandatory so bunyan-opbeat gets the log as an object
      stream: new BunyanOpbeat({
        config: {
          appId: '...',
          organizationId: '...',
          secretToken: '...',
          // you can also add any other parameter that opbeat module accepts, it will be passed on
        }
      })
    }
  ]
})

log.error(new Error('whoops'))
```

Alternatively, if you've already started an opbeat instance somewhere else in your code, you can pass it directly to bunyan-opbeat and it will use it instead:

``` js
var bunyan = require('bunyan')
var BunyanOpbeat = require('bunyan-opbeat')
var opbeat = require('opbeat').start({
  appId: '...',
  organizationId: '...',
  secretToken: '...'
})

var log = bunyan.createLogger({
  name: 'my-logger',
  streams: [
    {
      level: 'warn',
      type: 'raw', // <-- this is mandatory so bunyan-opbeat gets the log as an object
      stream: new BunyanOpbeat({
        client: opbeat
      })
    }
  ]
})

log.error(new Error('whoops'))
```

* **note**: `bunyan-opbeat` requires `opbeat` client version >= 4.8.0

### How does it work?
bunyan-opbeat reads data coming from your bunyan logger and uses `opbeat.captureError()` to post it to Opbeat.
It will do it's best to pass on some common fields like `user`, `time`, `hostname` and `level`.
Anything else in your logs that opbeat can't understand will be passed as an `extra` field

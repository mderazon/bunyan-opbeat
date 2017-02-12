var opbeat = require('opbeat')

var RESERVED = ['user', 'time', 'level', 'name', 'hostname', 'err']

function BunyanOpbeat (options) {
  options = options || {}
  if (!options.client && !options.config) {
    throw new Error('bunyan-opbeat needs an existing opbeat client or opbeat config parameters to start')
  }
  if (options.config && (!options.config.appId || !options.config.organizationId || !options.config.secretToken)) {
    throw new Error('bunyan-opbeat requires a config object with appId, organizationId and secretToken')
  }

  this.opbeatClient = options.client || opbeat.start(options.config)
}

BunyanOpbeat.prototype.write = function (data) {
  if (typeof data !== 'object') {
    throw new Error('bunyan-opbeat requires a raw stream. Please define the type as raw when setting up the bunyan stream.')
  }

  var obj = {}
  var extra = {}
  obj.level = nameFromLevel[data.level]
  obj.logger = data.name
  obj.machine = { hostname: data.hostname }
  obj.timestamp = data.time

  if (data.err) {
    data.err = deserializeError(data.err)
  }

  // set user context if exists
  if (data.user) {
    this.opbeatClient.setUserContext(data.user)
  }

  // set other extra data attached
  Object.keys(data).filter(function (k) {
    return RESERVED.indexOf(k) === -1
  }).forEach(function (k) {
    extra[k] = data[k]
  })
  this.opbeatClient.setExtraContext(extra)

  this.opbeatClient.captureError(data.err || data.msg, obj)
}

module.exports = BunyanOpbeat

var nameFromLevel = {
  60: 'fatal',
  50: 'error',
  40: 'warning',
  30: 'info',
  20: 'debug',
  10: 'debug'
}

// bunyan serielizes errors into objects. we need to turn them back into errors
function deserializeError (obj) {
  if (obj instanceof Error) {
    return obj
  }

  var error = new Error(obj.message)
  Object.getPrototypeOf(error).name = obj.name
  Object.getPrototypeOf(error).stack = obj.stack
  return error
}

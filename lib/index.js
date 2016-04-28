var opbeat = require('opbeat')

var RESERVED = ['time', 'level', 'name', 'hostname', 'err']
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

  var obj = { extra: {} }
  obj.level = name_from_level[data.level]
  obj.logger = data.name
  obj.machine = { hostname: data.hostname }
  obj.timestamp = data.time

  if (data.user) {
    obj.user = data.user
  }

  if (data.err) {
    data.err = deserializeError(data.err)
  }

  Object.keys(data).filter(function (k) {
    return RESERVED.indexOf(k) === -1
  }).forEach(function (k) {
    obj.extra[k] = data[k]
  })

  this.opbeatClient.captureError(data.err || data.msg, obj)
}

module.exports = BunyanOpbeat

var name_from_level = {
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
  error.name = obj.name
  error.stack = obj.stack
  error.code = obj.code
  error.signal = obj.signal
  return error
}

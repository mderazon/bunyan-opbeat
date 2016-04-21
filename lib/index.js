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

  this.opbeat_client = options.client || opbeat.start(options.config)
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

  Object.keys(data).filter(function (k) {
    return RESERVED.indexOf(k) === -1
  }).forEach(function (k) {
    obj.extra[k] = data[k]
  })

  this.opbeat_client.captureError(data.err || data.msg, obj)
}

module.exports = BunyanOpbeat

var name_from_level = {
  60: 'fatal',
  50: 'error',
  40: 'warn',
  30: 'info',
  20: 'debug',
  10: 'trace'
}
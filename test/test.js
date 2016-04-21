var test = require('tape')
var proxyquire = require('proxyquire')
var noop = function () {}

var mock_config = {
  appId: '123',
  organizationId: '456',
  secretToken: '789'
}

function get_base_mock () {
  return {
    opbeat: {
      start: function () {
        return {
          captureError: noop
        }
      }
    }
  }
}

test('BunyanOpbeat exists', function (t) {
  t.plan(1)
  var BunyanOpbeat = require('../')
  t.equal(typeof BunyanOpbeat, 'function', 'BunyanOpbeat is a function')
})

test('BunyanOpbeat throws on no config or client', function (t) {
  t.plan(2)
  var BunyanOpbeat = require('../')
  var msg = /bunyan-opbeat needs an existing opbeat client or opbeat config parameters to start/

  t.throws(function () { return new BunyanOpbeat() }, msg, 'throws on no config or client')
  t.throws(function () { return new BunyanOpbeat({}) }, msg, 'throws on no config or client')
})

test('BunyanOpbeat throws on bad config', function (t) {
  t.plan(3)
  var BunyanOpbeat = require('../')
  var msg = /bunyan-opbeat requires a config object with appId, organizationId and secretToken/

  t.throws(function () { return new BunyanOpbeat({config: {appId: '', organizationId: ''}}) }, msg, 'throws on bad config')
  t.throws(function () { return new BunyanOpbeat({config: {appId: '', secretToken: ''}}) }, msg, 'throws on bad config')
  t.throws(function () { return new BunyanOpbeat({config: {organizationId: '', secretToken: ''}}) }, msg, 'throws on bad config')
})

test('BunyanOpbeat throws on bad config', function (t) {
  t.plan(3)
  var BunyanOpbeat = require('../')
  var msg = /bunyan-opbeat requires a config object with appId, organizationId and secretToken/

  t.throws(function () { return new BunyanOpbeat({config: {appId: '', organizationId: ''}}) }, msg, 'throws on bad config')
  t.throws(function () { return new BunyanOpbeat({config: {appId: '', secretToken: ''}}) }, msg, 'throws on bad config')
  t.throws(function () { return new BunyanOpbeat({config: {organizationId: '', secretToken: ''}}) }, msg, 'throws on bad config')
})

test('BunyanOpbeat throws if write invoked with non raw stream', function (t) {
  t.plan(2)
  var BunyanOpbeat = require('../')
  var bunyanOpbeat = new BunyanOpbeat({config: mock_config})
  var msg = /bunyan-opbeat requires a raw stream. Please define the type as raw when setting up the bunyan stream./

  t.throws(function () { bunyanOpbeat.write() }, msg, 'throws on bad stream')
  t.throws(function () { bunyanOpbeat.write('foo') }, msg, 'throws on bad stream')
})

test('BunyanOpbeat creates opbeat client', function (t) {
  t.plan(3)
  var mock = get_base_mock()
  mock.opbeat.start = function (config) {
    t.equal(config.appId, mock_config.appId, 'correct appId')
    t.equal(config.organizationId, mock_config.organizationId, 'correct organizationId')
    t.equal(config.secretToken, mock_config.secretToken, 'correct secretToken')
  }
  var BunyanOpbeat = proxyquire('../', mock)

  return new BunyanOpbeat({config: mock_config})
})

test('BunyanOpbeat sends data correctly', function (t) {
  t.plan(8)
  var data = {
    err: new Error('test'),
    user: {id: 'bobo'},
    time: new Date(),
    level: 40,
    name: 'Bobo',
    hostname: 'bobohost',
    another: {
      first: true,
      secnd: 1,
      third: 'bobo'
    }
  }
  var mock = get_base_mock()
  mock.opbeat.start = function (config) {
    return {
      captureError: function (err, obj) {
        t.equal(err, data.err, 'correct error')
        t.deepEqual(obj.user, data.user, 'correct user')
        t.equal(obj.timestamp, data.time, 'correct time')
        t.equal(obj.machine.hostname, data.hostname, 'correct hostname')
        t.equal(obj.level, 'warn', 'correct log level')
        t.equal(obj.logger, data.name, 'correct name')
        t.deepEqual(obj.extra.another, data.another, 'correct extra')
        t.deepEqual(obj.extra.user, data.user, 'correct user in extra')
      }
    }
  }
  var BunyanOpbeat = proxyquire('../', mock)
  var bunyanOpbeat = new BunyanOpbeat({config: mock_config})

  bunyanOpbeat.write(data)
})

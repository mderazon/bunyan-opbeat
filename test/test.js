var test = require('tape')
var proxyquire = require('proxyquire')

var noop = function () {}
var mockConfig = {
  appId: '123',
  organizationId: '456',
  secretToken: '789'
}

function getBaseMock () {
  return {
    opbeat: {
      start: function () {
        return {
          captureError: noop,
          setUserContext: noop,
          setExtraContext: noop
        }
      }
    }
  }
}

test('BunyanOpbeat exists', function (t) {
  var BunyanOpbeat = require('../')
  t.equal(typeof BunyanOpbeat, 'function', 'BunyanOpbeat is a function')
  t.end()
})

test('BunyanOpbeat throws on no config or client', function (t) {
  var BunyanOpbeat = require('../')
  var msg = /bunyan-opbeat needs an existing opbeat client or opbeat config parameters to start/

  t.throws(function () { return new BunyanOpbeat() }, msg, 'throws on no config or client')
  t.throws(function () { return new BunyanOpbeat({}) }, msg, 'throws on no config or client')
  t.end()
})

test('BunyanOpbeat throws on bad config', function (t) {
  var BunyanOpbeat = require('../')
  var msg = /bunyan-opbeat requires a config object with appId, organizationId and secretToken/

  t.throws(function () { return new BunyanOpbeat({config: {appId: '', organizationId: ''}}) }, msg, 'throws on bad config')
  t.throws(function () { return new BunyanOpbeat({config: {appId: '', secretToken: ''}}) }, msg, 'throws on bad config')
  t.throws(function () { return new BunyanOpbeat({config: {organizationId: '', secretToken: ''}}) }, msg, 'throws on bad config')
  t.end()
})

test('BunyanOpbeat throws if write invoked with non raw stream', function (t) {
  var BunyanOpbeat = require('../')
  var bunyanOpbeat = new BunyanOpbeat({config: mockConfig})
  var msg = /bunyan-opbeat requires a raw stream. Please define the type as raw when setting up the bunyan stream./

  t.throws(function () { bunyanOpbeat.write() }, msg, 'throws on bad stream')
  t.throws(function () { bunyanOpbeat.write('foo') }, msg, 'throws on bad stream')
  t.end()
})

test('BunyanOpbeat creates opbeat client', function (t) {
  var mock = getBaseMock()
  mock.opbeat.start = function (config) {
    t.equal(config.appId, mockConfig.appId, 'correct appId')
    t.equal(config.organizationId, mockConfig.organizationId, 'correct organizationId')
    t.equal(config.secretToken, mockConfig.secretToken, 'correct secretToken')
    t.end()
  }
  var BunyanOpbeat = proxyquire('../', mock)

  return new BunyanOpbeat({config: mockConfig})
})

test('BunyanOpbeat sends data correctly', function (t) {
  t.plan(7)
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
  var mock = getBaseMock()
  mock.opbeat.start = function (config) {
    return {
      captureError: function (err, obj) {
        t.equal(err, data.err, 'correct error')
        t.equal(obj.timestamp, data.time, 'correct time')
        t.equal(obj.machine.hostname, data.hostname, 'correct hostname')
        t.equal(obj.level, 'warning', 'correct log level')
        t.equal(obj.logger, data.name, 'correct name')
      },
      setUserContext: function (user) {
        t.deepEqual(user, data.user, 'correct user')
      },
      setExtraContext: function (extra) {
        t.deepEqual(extra, {another: data.another}, 'correct extra')
      }
    }
  }
  var BunyanOpbeat = proxyquire('../', mock)
  var bunyanOpbeat = new BunyanOpbeat({config: mockConfig})

  bunyanOpbeat.write(data)
})

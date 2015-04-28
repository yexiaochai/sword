var assert = require('assert')
var garbage = require('garbage')
var JSONL = require('../')

describe('parse', function () {
  it('accepts anything that JSON accepts', function () {
    for (var i = 0; i < 10000; i++) {
      var obj = garbage()
      var str = JSON.stringify(obj)
      try {
        assert.deepEqual(JSON.parse(str), JSONL.parse(str, {circular: false}))
      } catch (ex) {
        ex.message += '\n' + str
        throw ex
      }
    }
  })
})
describe('stringify -> parse', function () {
  it('can handle anything that JSON accepts', function () {
    for (var i = 0; i < 10000; i++) {
      var obj = garbage()
      var str = JSONL.stringify(obj, {circular: false})
      try {
        assert(typeof str === 'string')
        assert.deepEqual(obj, JSONL.parse(str, {circular: false}))
        assert.throws(function () {
          JSON.parse(str)
        })
      } catch (ex) {
        ex.message += '\n' + JSON.stringify(obj) + '\n' + str
        throw ex
      }
    }
  })
})

describe('dates', function () {
  it('stringifies them', function () {
    assert(JSONL.stringify(new Date('2013-07-13T00:28:00.000Z')) === '(new Date("2013-07-13T00:28:00.000Z"))')
  })
  it('parses them', function () {
    assert.deepEqual(new Date('2013-07-13T00:28:00.000Z'), JSONL.parse('(new Date("2013-07-13T00:28:00.000Z"))'))
  })
})
describe('regexps', function () {
  it('stringifies them', function () {
    assert(JSONL.stringify(/^[a-z]+$/g) === '(/^[a-z]+$/g)')
  })
  it('parses them', function () {
    assert.deepEqual(/^[a-z]+$/g, JSONL.parse('(/^[a-z]+$/g)'))
  })
})
describe('regexps', function () {
  it('stringifies them', function () {
    assert(JSONL.stringify(/^[a-z]+$/g) === '(/^[a-z]+$/g)')
  })
  it('parses them', function () {
    assert.deepEqual(/^[a-z]+$/g, JSONL.parse('(/^[a-z]+$/g)'))
  })
})


describe('circular', function () {
  it('accepts anything that JSON accepts', function () {
    for (var i = 0; i < 10000; i++) {
      var obj = garbage()
      var str = JSON.stringify(obj)
      try {
        assert.deepEqual(JSON.parse(str), JSONL.parse(str, {circular: true}))
      } catch (ex) {
        ex.message += '\n' + str
        throw ex
      }
    }
  })
  describe('stringify -> parse', function () {
    it('can handle anything that JSON accepts', function () {
      for (var i = 0; i < 10000; i++) {
        var obj = garbage()
        var str = JSONL.stringify(obj, {circular: true})
        try {
          assert(typeof str === 'string')
          assert.deepEqual(obj, JSONL.parse(str, {circular: true}))
          assert.throws(function () {
            JSON.parse(str)
          })
        } catch (ex) {
          ex.message += '\n' + JSON.stringify(obj) + '\n' + str
          throw ex
        }
      }
    })
    it('can handle circular references', function () {
      var x = {y: 10, e: {}}
      x.z = x
      x.f = x.e
      var str = JSONL.stringify(x)
      assert(typeof str === 'string')
      var obj = JSONL.parse(str)
      assert(obj.y === 10)
      assert(obj.z === obj)
      assert(obj.e === obj.f)
      obj.e.val = 10
      assert(obj.f.val === 10)
    })
  })
})
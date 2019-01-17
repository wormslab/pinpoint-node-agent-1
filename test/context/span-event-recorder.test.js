const test = require('tape')
const { log, fixture, util } = require('../test-helper')

const Span = require('../../src/context/span')
const SpanEvent = require('../../src/context/span-event')
const SpanEventRecorder = require('../../src/context/span-event-recorder')

const ServiceTypeCode = require('../../src/constant/service-type').ServiceTypeCode
const ExpressMethodDescritpor = require('../../src/constant/method-descriptor').ExpressMethodDescritpor

test('Should create span event recorder', async function (t) {
  t.plan(2)

  const span = new Span(fixture.getTraceId(), fixture.getAgentInfo())
  const spanEvent = new SpanEvent(span.spanId, 0)
  const spanEventRecorder = new SpanEventRecorder(spanEvent, span)
  spanEventRecorder.recordServiceType(ServiceTypeCode.express)
  spanEventRecorder.recordApi(ExpressMethodDescritpor.HANDLE)
  t.ok(spanEventRecorder.spanEvent)

  spanEventRecorder.spanEvent.startTime = Date.now()
  await util.sleep(101)
  spanEventRecorder.spanEvent.markElapsedTime()
  t.ok(spanEventRecorder.spanEvent.endElapsed > 100)
})

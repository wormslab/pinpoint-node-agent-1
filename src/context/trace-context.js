const SpanRecorder = require('./span-recorder')
const SpanEventRecorder = require('./span-event-recorder')

class TraceContext {
  constructor () {
    this.spanRecorder = null;
    this.spanEventRecorder = null;
  }

  createNew () {
    this.spanRecorder = new SpanRecorder()
    this.spanEventRecorder = new SpanEventRecorder();
    return this
  }
}

module.exports = TraceContext

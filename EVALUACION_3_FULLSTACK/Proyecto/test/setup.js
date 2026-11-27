// jsdom does not implement MessageChannel, used by React's asynchronous act().
// Real browsers use their native implementation.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
if (!globalThis.MessageChannel) {
  globalThis.MessageChannel = class {
    constructor() {
      this.port1 = { onmessage: null };
      this.port2 = { postMessage: data => setTimeout(() => this.port1.onmessage?.({ data }), 0) };
    }
  };
}

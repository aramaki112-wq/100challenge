(() => {
  const GLUE_URL = './yaneuraou.material.js';
  const MAIN_SCRIPT_URL = new URL(GLUE_URL, self.location.href).href;
  const queue = [];
  let instance = null;
  let failed = null;

  const emit = (line) => self.postMessage({type: 'line', line: String(line ?? '')});
  const fail = (error) => {
    failed = error instanceof Error ? error : new Error(String(error));
    self.postMessage({
      type: 'engine-error',
      message: failed.message,
      stack: failed.stack || '',
    });
  };
  const execute = (command) => {
    if (failed) throw failed;
    if (!instance) {
      queue.push(String(command));
      return;
    }
    instance.postMessage(String(command));
  };

  self.addEventListener('message', (event) => {
    try { execute(event.data); } catch (error) { fail(error); }
  });
  self.addEventListener('error', (event) => {
    self.postMessage({
      type: 'worker-error-event',
      message: event.message || 'worker error',
      filename: event.filename || '',
      lineno: event.lineno || 0,
      colno: event.colno || 0,
    });
  });

  try {
    self.importScripts(GLUE_URL);
    const factory = self.YaneuraOu_Material;
    if (typeof factory !== 'function') throw new Error('YaneuraOu_Material factory missing.');
    Promise.resolve(factory({
      mainScriptUrlOrBlob: MAIN_SCRIPT_URL,
      printErr: (line) => self.postMessage({type: 'stderr', line: String(line ?? '')}),
    })).then((mod) => {
      if (typeof mod?.postMessage !== 'function' || typeof mod?.addMessageListener !== 'function') {
        throw new Error('wasm_pre.js bridge missing.');
      }
      instance = mod;
      instance.addMessageListener(emit);
      self.postMessage({type: 'module-ready'});
      while (queue.length) execute(queue.shift());
    }).catch(fail);
  } catch (error) {
    fail(error);
  }
})();

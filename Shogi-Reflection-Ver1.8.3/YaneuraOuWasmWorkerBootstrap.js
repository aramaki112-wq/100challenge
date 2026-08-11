/*
 * Shogi Reflection outer classic Worker bootstrap for the pinned official
 * YaneuraOu V9.00 MATERIAL WebAssembly build.
 *
 * The pinned source tree's own WASM workflow uses Emscripten 3.1.43 and
 * script/wasm_build.js "material". That profile generates:
 *   yaneuraou.material.js
 *   yaneuraou.material.worker.js
 *   yaneuraou.material.wasm
 * and exports the factory as YaneuraOu_Material.
 */
(() => {
  const GLUE_URL = "./yaneuraou.material.js";
  const queue = [];
  let moduleInstance = null;
  let failed = null;

  function emit(line) {
    self.postMessage(String(line ?? ""));
  }

  function fatal(error) {
    failed = error instanceof Error ? error : new Error(String(error));
    self.postMessage({ type: "engine-error", message: failed.message });
  }

  function execute(command) {
    if (failed) throw failed;
    if (!moduleInstance) {
      queue.push(String(command));
      return;
    }
    if (typeof moduleInstance.postMessage !== "function") {
      throw new Error("Official YaneuraOu WASM Module.postMessage() was not found.");
    }
    moduleInstance.postMessage(String(command));
  }

  self.addEventListener("message", (event) => {
    try { execute(String(event.data ?? "")); }
    catch (error) { fatal(error); }
  });

  try {
    self.importScripts(GLUE_URL);
    const factory = self.YaneuraOu_Material;
    if (typeof factory !== "function") {
      throw new Error("Official Emscripten factory YaneuraOu_Material was not found.");
    }
    Promise.resolve(factory({
      printErr: (line) => emit(`info string ${String(line ?? "")}`)
    })).then((instance) => {
      if (typeof instance?.addMessageListener !== "function" || typeof instance?.postMessage !== "function") {
        throw new Error("Official YaneuraOu wasm_pre.js message bridge was not exposed by the build.");
      }
      moduleInstance = instance;
      moduleInstance.addMessageListener(emit);
      while (queue.length) execute(queue.shift());
    }).catch(fatal);
  } catch (error) {
    fatal(error);
  }
})();

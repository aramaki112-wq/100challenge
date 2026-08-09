/*
 * Classic Worker bootstrap for an official-source Emscripten YaneuraOu build.
 * Expected generated assets:
 *   ./engine/yaneuraou/yaneuraou.js
 *   ./engine/yaneuraou/yaneuraou.wasm
 *   ./engine/yaneuraou/yaneuraou.worker.js (when emitted by Emscripten pthreads)
 *
 * The app never imports this file unless engine-manifest.json marks the build available.
 */
(() => {
  const GLUE_URL = "./engine/yaneuraou/yaneuraou.js";
  const ASSET_BASE = "./engine/yaneuraou/";
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
      queue.push(command);
      return;
    }
    if (typeof moduleInstance.ccall === "function") {
      moduleInstance.ccall("usi_command", null, ["string"], [String(command)]);
      return;
    }
    if (typeof moduleInstance.usi_command === "function") {
      moduleInstance.usi_command(String(command));
      return;
    }
    throw new Error("YaneuraOu WASM build does not expose usi_command/ccall.");
  }

  self.addEventListener("message", (event) => {
    try { execute(String(event.data ?? "")); }
    catch (error) { fatal(error); }
  });

  try {
    self.importScripts(GLUE_URL);
    const factory = self.YaneuraOu;
    if (typeof factory !== "function") throw new Error("Emscripten factory YaneuraOu was not found.");
    Promise.resolve(factory({
      print: emit,
      printErr: (line) => emit(`info string ${String(line ?? "")}`),
      locateFile(path) {
        const fileName = String(path).split("/").pop();
        return `${ASSET_BASE}${fileName}`;
      }
    })).then((instance) => {
      moduleInstance = instance;
      while (queue.length) execute(queue.shift());
    }).catch(fatal);
  } catch (error) {
    fatal(error);
  }
})();

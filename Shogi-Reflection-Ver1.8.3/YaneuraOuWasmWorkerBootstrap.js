/*
 * Classic Worker bootstrap for the official-source Emscripten YaneuraOu build.
 * Expected runtime assets:
 *   ./engine/yaneuraou/yaneuraou.js
 *   ./engine/yaneuraou/yaneuraou.wasm
 *
 * Pinned Emscripten 4.0.15 does NOT emit a separate pthread .worker.js.
 * Its pthread runtime reuses the generated main JS as the pthread Worker script.
 * This file is Shogi Reflection's outer classic Worker bootstrap and remains the
 * BrowserWorkerUsiTransport boundary.
 *
 * The official V9.00 source/wasm_pre.js exposes a small Module API:
 *   addMessageListener(listener)
 *   removeMessageListener(listener)
 *   postMessage(command)
 *   terminate()
 *
 * postMessage() is intentionally used instead of directly calling usi_command():
 * the official pre-js owns command queueing, retry/backoff while pthreads are
 * still starting, and the quit -> terminate path.  Application code remains
 * unaware of these YaneuraOu/Emscripten details.
 *
 * The app never imports this file unless engine-manifest.json marks the build
 * available after the asset/hash gate succeeds.
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
      queue.push(String(command));
      return;
    }

    if (typeof moduleInstance.postMessage !== "function") {
      throw new Error(
        "Official YaneuraOu WASM Module.postMessage() was not found. " +
        "Build with source/wasm_pre.js from the pinned official source."
      );
    }

    // Official wasm_pre.js owns retry/backoff and quit -> terminate.
    moduleInstance.postMessage(String(command));
  }

  self.addEventListener("message", (event) => {
    try {
      execute(String(event.data ?? ""));
    } catch (error) {
      fatal(error);
    }
  });

  try {
    self.importScripts(GLUE_URL);
    const factory = self.YaneuraOu;
    if (typeof factory !== "function") {
      throw new Error("Emscripten factory YaneuraOu was not found.");
    }

    Promise.resolve(factory({
      printErr: (line) => emit(`info string ${String(line ?? "")}`),
      locateFile(path) {
        const fileName = String(path).split("/").pop();
        return `${ASSET_BASE}${fileName}`;
      }
    })).then((instance) => {
      if (
        typeof instance?.addMessageListener !== "function" ||
        typeof instance?.postMessage !== "function"
      ) {
        throw new Error(
          "Official YaneuraOu wasm_pre.js message bridge was not exposed by the build."
        );
      }

      moduleInstance = instance;
      moduleInstance.addMessageListener(emit);

      while (queue.length) {
        execute(queue.shift());
      }
    }).catch(fatal);
  } catch (error) {
    fatal(error);
  }
})();

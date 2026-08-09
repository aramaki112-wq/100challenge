export class BrowserApplicationView {
  constructor({ documentObject = document } = {}) {
    this.document = documentObject;
    this.views = new Map([
      ["WORKFLOW", this.#required("workflow-view")],
      ["LIBRARY", this.#required("library-view")],
      ["HELP", this.#required("help-view")]
    ]);
  }

  #required(id) {
    const element = this.document.getElementById(id);
    if (!element) throw new Error(`必要なApplication Viewがありません: #${id}`);
    return element;
  }

  show(name) {
    if (!this.views.has(name)) throw new TypeError(`未知のApplication Viewです: ${name}`);
    for (const [key, element] of this.views) element.hidden = key !== name;
    const active = this.views.get(name);
    active?.scrollIntoView?.({ behavior: "auto", block: "start" });
    return name;
  }
}

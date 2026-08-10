const DEFAULT_EDGE_PADDING = 12;

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

/**
 * Replayの「現在手を見える位置へ追従する」責務だけを扱うUI Policy。
 * Browser Page全体のScrollは一切扱わず、Move List ContainerのscrollTopだけを更新する。
 */
export class ReplayScrollPolicy {
  constructor({ edgePadding = DEFAULT_EDGE_PADDING } = {}) {
    this.edgePadding = Math.max(0, finiteNumber(edgePadding, DEFAULT_EDGE_PADDING));
  }

  createTarget(currentMoveId) {
    return Object.freeze({
      currentMoveId: String(currentMoveId ?? ""),
      scope: "MOVE_LIST_CONTAINER",
      pageScroll: "NONE"
    });
  }

  isItemVisible({ containerRect, itemRect } = {}) {
    if (!containerRect || !itemRect) return false;
    const top = finiteNumber(containerRect.top) + this.edgePadding;
    const bottom = finiteNumber(containerRect.bottom) - this.edgePadding;
    return finiteNumber(itemRect.top) >= top && finiteNumber(itemRect.bottom) <= bottom;
  }

  calculateScrollTop({
    currentScrollTop = 0,
    containerRect,
    itemRect
  } = {}) {
    const current = Math.max(0, finiteNumber(currentScrollTop));
    if (!containerRect || !itemRect) return current;

    const containerTop = finiteNumber(containerRect.top);
    const containerBottom = finiteNumber(containerRect.bottom);
    const itemTop = finiteNumber(itemRect.top);
    const itemBottom = finiteNumber(itemRect.bottom);
    const visibleTop = containerTop + this.edgePadding;
    const visibleBottom = containerBottom - this.edgePadding;

    if (itemTop < visibleTop) {
      return Math.max(0, current - (visibleTop - itemTop));
    }
    if (itemBottom > visibleBottom) {
      return Math.max(0, current + (itemBottom - visibleBottom));
    }
    return current;
  }

  followCurrentMove({ container, item } = {}) {
    if (!container) {
      return Object.freeze({ status: "NO_CONTAINER", changed: false, pageScrollRequested: false });
    }
    if (!item) {
      return Object.freeze({ status: "NO_ITEM", changed: false, pageScrollRequested: false });
    }
    if (
      typeof container.getBoundingClientRect !== "function" ||
      typeof item.getBoundingClientRect !== "function"
    ) {
      return Object.freeze({ status: "UNSUPPORTED_DOM", changed: false, pageScrollRequested: false });
    }

    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    if (this.isItemVisible({ containerRect, itemRect })) {
      return Object.freeze({ status: "VISIBLE", changed: false, pageScrollRequested: false });
    }

    const currentScrollTop = finiteNumber(container.scrollTop);
    const nextScrollTop = this.calculateScrollTop({
      currentScrollTop,
      containerRect,
      itemRect
    });
    if (nextScrollTop !== currentScrollTop) {
      container.scrollTop = nextScrollTop;
      return Object.freeze({
        status: "SCROLLED_WITHIN_MOVE_LIST",
        changed: true,
        scrollTop: nextScrollTop,
        pageScrollRequested: false
      });
    }

    return Object.freeze({ status: "UNCHANGED", changed: false, pageScrollRequested: false });
  }
}

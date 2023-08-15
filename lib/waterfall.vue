<template>
  <div ref="root"
       class="vue-waterfall"
       :style="style">
    <slot></slot>
  </div>
</template>

<style>
.vue-waterfall {
  position: relative;
}
</style>

<script setup lang="ts">
import type { Align, Line, Meta, Rect } from "./common";

import { getCurrentInstance, ref, toRefs, onMounted, onBeforeUnmount, watch, VNodeArrayChildren, VNode } from 'vue'
import {
  reflowEvent, reflowedEvent, on, off, addClass,
  removeClass,
} from "./common"

type Options = ReturnType<typeof getOptions>;

const instance = getCurrentInstance();
const root = ref<HTMLElement | null>(null);
const child = ref<HTMLElement | null>(null);
const MOVE_CLASS_PROP = '_wfMoveClass'
type Props = {
  autoResize?: boolean,
  interval?: number,
  align?: "left" | "center" | "right",
  line?: Line,
  lineGap: number,
  minLineGap?: number,
  maxLineGap?: number,
  singleMaxWidth?: number,
  fixedHeight?: boolean,
  grow?: Array<any>,
  datas?: Array<any>,
}

const props = withDefaults(defineProps<Props>(), {
  autoResize: true,
  interval: 200,
  align: "left",
  line: "v",
  minLineGap: 0,
  maxLineGap: 0,
  fixedHeight: false,
  datas: Array<any>
});

const emit = defineEmits(["reflowed"]);
const { autoResize, interval, align, line, lineGap, minLineGap, maxLineGap, singleMaxWidth, fixedHeight, grow, datas } = toRefs(props);

const style = ref({
  height: '',
  overflow: '',
  transform: '',
  transitionDuration: "",
});

const timerId = ref<any>(null);
let virtualRects: Array<Rect> = [];

onMounted(() => {
  reflowEvent.on((child: any) => {
    reflowHandler();
  });
  watch(() => ([align, line, lineGap, minLineGap, maxLineGap, singleMaxWidth, fixedHeight, datas, grow, autoResize]), reflowHandler, { deep: true });
  on(root.value, getTransitionEndEvent(), tidyUpAnimations, true)
  autoResizeHandler(autoResize.value)
})

onBeforeUnmount(() => {
  autoResizeHandler(false)
  off(root.value, getTransitionEndEvent(), tidyUpAnimations, true)
})

function autoResizeHandler(autoResize: boolean) {
  if (autoResize === false || !autoResize) {
    off(window, 'resize', reflowHandler, false)
  } else {
    on(window, 'resize', reflowHandler, false)
  }
}

function tidyUpAnimations(event: Event) {
  let node = event.target as HTMLElement;
  if (!node) {
    return;
  }

  let moveClass = node.classList.contains(MOVE_CLASS_PROP);
  if (moveClass) {
    removeClass(node, MOVE_CLASS_PROP)
  }
}

function reflowHandler() {
  if (timerId.value) {
    clearTimeout(timerId.value)
  }
  timerId.value = setTimeout(reflow, interval.value)
}

function getChildMetas(): Meta[] {
  let childs = root.value?.children ?? [];
  let metas: Meta[] = Array(childs.length);
  let childProps: any[] = [];
  if (instance && instance.slots && instance.slots.default) {
    let slot = instance.slots.default() ?? [];
    if (slot.length > 0 && slot[0] && slot[0].children) {
      childProps = (slot[0].children as VNodeArrayChildren).map(item => (item as VNode).props);
    }
  }
  for (let i = 0; i < childs.length && i < metas.length; i++) {
    let el = childs[i];
    let props = childProps[i];
    metas[i] = Object.assign({}, props, { node: el })
  }

  return metas;
}

function reflow() {
  if (!root.value) { return }
  let width = root.value.clientWidth;
  let metas = getChildMetas();
  metas.sort((a, b) => a.order - b.order)
  virtualRects = metas.map(() => ({ width: 0, height: 0, left: 0, top: 0 }))
  calculate(metas, virtualRects)
  setTimeout(() => {
    if (isScrollBarVisibilityChange(root.value, width)) {
      calculate(metas, virtualRects)
    }
    style.value.overflow = 'hidden'
    render(virtualRects, metas)
    reflowedEvent.emit(instance as any)
    emit("reflowed");
  }, 0)
}

function isScrollBarVisibilityChange(el: HTMLElement | null, lastClientWidth: number) {
  return lastClientWidth !== el?.clientWidth
}

function calculate(metas: Meta[], rects: Rect[]) {
  let options = getOptions()
  let processor = line.value === 'h' ? horizontalLineProcessor : verticalLineProcessor
  processor.calculate(options, metas, rects)
}


function getOptions() {
  const maxLGap = maxLineGap.value ? +maxLineGap.value : lineGap.value
  return {
    align: ~['left', 'right', 'center'].indexOf(align.value) ? align.value : 'left',
    line: ~['v', 'h'].indexOf(line.value) ? line.value : 'v',
    lineGap: +lineGap.value,
    minLineGap: minLineGap.value ? +minLineGap.value : lineGap.value,
    maxLineGap: maxLGap,
    singleMaxWidth: Math.max(singleMaxWidth?.value || 0, maxLGap),
    fixedHeight: !!fixedHeight.value,
    grow: grow?.value && grow.value.map(val => +val)
  }
}

let verticalLineProcessor = (() => {
  function calculate(options: Options, metas: Meta[], rects: Rect[]) {
    let width = root.value?.clientWidth ?? 0;
    let grow = options.grow;
    let strategy = grow
      ? getRowStrategyWithGrow(width, grow)
      : getRowStrategy(width, options)
    let tops = getArrayFillWith(0, strategy.count)
    metas.forEach((meta, index) => {
      let offset = tops.reduce((last, top, i) => top < tops[last] ? i : last, 0);
      let width = strategy.width[offset % strategy.count]
      let rect = rects[index]
      rect.top = tops[offset];
      rect.left = strategy.left + (offset ? sum(strategy.width.slice(0, offset)) : 0);
      rect.width = width
      rect.height = meta.height * (options.fixedHeight ? 1 : width / meta.width)
      tops[offset] = tops[offset] + rect.height;
    })
    style.value.height = Math.max.apply(Math, tops) + 'px';
    console.log("style.value.height:", style.value.height);
  }

  function getRowStrategy(width: number, options: Options) {
    let count = width / options.lineGap
    let slotWidth: number;
    if (options.singleMaxWidth >= width) {
      count = 1
      slotWidth = Math.max(width, options.minLineGap)
    } else {
      let maxContentWidth = options.maxLineGap * ~~count
      let minGreedyContentWidth = options.minLineGap * ~~(count + 1)
      let canFit = maxContentWidth >= width
      let canFitGreedy = minGreedyContentWidth <= width
      if (canFit && canFitGreedy) {
        count = Math.round(count)
        slotWidth = width / count
      } else if (canFit) {
        count = ~~count
        slotWidth = width / count
      } else if (canFitGreedy) {
        count = ~~(count + 1)
        slotWidth = width / count
      } else {
        count = ~~count
        slotWidth = options.maxLineGap
      }
      if (count === 1) {
        slotWidth = Math.min(width, options.singleMaxWidth)
        slotWidth = Math.max(slotWidth, options.minLineGap)
      }
    }
    return {
      width: getArrayFillWith(slotWidth, count),
      count: count,
      left: getLeft(width, (slotWidth) * count, options.align)
    }
  }

  function getRowStrategyWithGrow(width: number, grow: Array<any>) {
    let total = sum(grow)
    return {
      width: grow.map(val => width * val / total),
      count: grow.length,
      left: 0
    }
  }

  return {
    calculate
  }
})();

let horizontalLineProcessor = (() => {
  type ContentSize = ReturnType<typeof getContentSize>;

  function calculate(options: Options, metas: Meta[], rects: Rect[]) {
    let width = root.value?.clientWidth ?? 0;
    let total = metas.length
    let top = 0
    let offset = 0
    while (offset < total) {
      let strategy = getRowStrategy(width, options, metas, offset)
      for (let i = 0, left = 0, meta, rect; i < strategy.count; i++) {
        meta = metas[offset + i]
        rect = rects[offset + i]
        rect.top = top
        rect.left = strategy.left + left
        rect.width = meta.width * strategy.height / meta.height
        rect.height = strategy.height
        left += rect.width
      }
      offset += strategy.count
      top += strategy.height
    }
    style.value.height = top + 'px'
  }

  function getRowStrategy(width: number, options: Options, metas: Meta[], offset: number) {
    let greedyCount = getGreedyCount(width, options.lineGap, metas, offset)
    let lazyCount = Math.max(greedyCount - 1, 1)
    let greedySize = getContentSize(width, options, metas, offset, greedyCount)
    let lazySize = getContentSize(width, options, metas, offset, lazyCount)
    let finalSize = chooseFinalSize(lazySize, greedySize, width)
    let height = finalSize.height
    let fitContentWidth = finalSize.width
    if (finalSize.count === 1) {
      fitContentWidth = Math.min(options.singleMaxWidth, width)
      height = metas[offset].height * fitContentWidth / metas[offset].width
    }
    return {
      left: getLeft(width, fitContentWidth, options.align),
      count: finalSize.count,
      height: height
    }
  }

  function getGreedyCount(rowWidth: number, rowHeight: number, metas: Meta[], offset: number) {
    let count = 0
    for (let i = offset, width = 0; i < metas.length && width <= rowWidth; i++) {
      width += metas[i].width * rowHeight / metas[i].height
      count++
    }
    return count
  }

  function getContentSize(rowWidth: number, options: Options, metas: Meta[], offset: number, count: number) {
    let originWidth = 0
    for (let i = count - 1; i >= 0; i--) {
      let meta = metas[offset + i]
      originWidth += meta.width * options.lineGap / meta.height
    }
    let fitHeight = options.lineGap * rowWidth / originWidth
    let canFit = (fitHeight <= options.maxLineGap && fitHeight >= options.minLineGap)
    if (canFit) {
      return {
        cost: Math.abs(options.lineGap - fitHeight),
        count: count,
        width: rowWidth,
        height: fitHeight
      }
    } else {
      let height = originWidth > rowWidth ? options.minLineGap : options.maxLineGap
      return {
        cost: Infinity,
        count: count,
        width: originWidth * height / options.lineGap,
        height: height
      }
    }
  }

  function chooseFinalSize(lazySize: ContentSize, greedySize: ContentSize, rowWidth: number) {
    if (lazySize.cost === Infinity && greedySize.cost === Infinity) {
      return greedySize.width < rowWidth ? greedySize : lazySize
    } else {
      return greedySize.cost >= lazySize.cost ? lazySize : greedySize
    }
  }

  return {
    calculate
  }

})();

function getLeft(width: number, contentWidth: number, align: Align) {
  switch (align) {
    case 'right':
      return width - contentWidth
    case 'center':
      return (width - contentWidth) / 2
    default:
      return 0
  }
}

function sum(arr: Array<number>) {
  return arr.reduce((sum, val) => sum + val)
}

function render(rects: Rect[], metas: Meta[]) {
  let metasNeedToMoveByTransform = metas.filter((meta) => meta.moveClass)
  let firstRects = getRects(metasNeedToMoveByTransform)
  applyRects(rects, metas)
  let lastRects = getRects(metasNeedToMoveByTransform)
  metasNeedToMoveByTransform.forEach((meta, i) => {

    Object.assign(meta.node, { [MOVE_CLASS_PROP]: meta.moveClass })
    setTransform(meta.node, firstRects[i], lastRects[i])
  })
  metasNeedToMoveByTransform.forEach((meta) => {
    addClass(meta.node, meta.moveClass)
    clearTransform(meta.node)
  })
}

function getRects(metas: Meta[]) {
  return metas.map((meta) => meta?.vm?.rect)
}

function applyRects(rects: Rect[], metas: Meta[]) {
  rects.forEach((rect, i) => {
    let style = metas[i].node.style
    for (let key in rect) {
      Object.assign(style, { [key]: rect[key] + 'px' });
    }
  })
}

function setTransform(node: HTMLElement, firstRect: Rect | undefined, lastRect: Rect | undefined) {
  if (firstRect && lastRect) {
    let dx = firstRect.left - lastRect.left
    let dy = firstRect.top - lastRect.top
    let sw = firstRect.width / lastRect.width
    let sh = firstRect.height / lastRect.height
    node.style.transform = `translate(${dx}px,${dy}px) scale(${sw},${sh})`
    node.style.transitionDuration = '0s'
  }
}

function clearTransform(node: HTMLElement) {
  node.style.transform = "";
  node.style.transitionDuration = '';
}

function getTransitionEndEvent() {
  return "transitionend"
}

function getArrayFillWith(item: Function | number | string, count: number) {
  let getter = (typeof item === 'function') ? () => item() : () => item
  let arr = []
  for (let i = 0; i < count; i++) {
    arr[i] = getter()
  }
  return arr
}

</script>

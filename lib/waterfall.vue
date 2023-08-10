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
import { getCurrentInstance, ref, toRefs, onMounted, onBeforeUnmount, watch } from 'vue'
import { reflowEvent, reflowedEvent } from "./common"

const root = ref<HTMLElement | null>(null);
const MOVE_CLASS_PROP = '_wfMoveClass'
type Align = "left" | "right" | "center";
type Line = "v" | "h";
type Props = {
  autoResize?: boolean,
  interval?: number,
  align?: Align,
  line?: Line,
  lineGap: number,
  minLineGap?: number,
  maxLineGap?: number,
  singleMaxWidth?: number,
  fixedHeight?: boolean,
  grow?: Array<any>,
  datas?: Array<any>,
}

const instance = getCurrentInstance();

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
  overflow: ''
});

const token = ref(null);
let virtualRects = [];
const childs = [];

onMounted(() => {
  reflowEvent.on((child) => {
    childs.push(child);
    reflowHandler()
  });
  watch(() => (
    align,
    line,
    lineGap,
    minLineGap,
    maxLineGap,
    singleMaxWidth,
    fixedHeight,
    datas
  ), reflowHandler)
  watch(grow, reflowHandler);
  watch(autoResize, autoResizeHandler)
  on(root.value, getTransitionEndEvent(), tidyUpAnimations, true)
  autoResizeHandler(autoResize)
})

onBeforeUnmount(() => {
  autoResizeHandler(false)
  off(root.value, getTransitionEndEvent(), tidyUpAnimations, true)
})

function autoResizeHandler(autoResize) {
  if (autoResize.value === false || !autoResize.value) {
    off(window, 'resize', reflowHandler, false)
  } else {
    on(window, 'resize', reflowHandler, false)
  }
}

function tidyUpAnimations(event) {
  let node = event.target
  let moveClass = node[MOVE_CLASS_PROP]
  if (moveClass) {
    removeClass(node, moveClass)
  }
}

function reflowHandler() {
  clearTimeout(token.value)
  token.value = setTimeout(reflow, interval.value)
}

function reflow() {
  if (!root.value) { return }
  console.log("reflow");

  let width = root.value.clientWidth;
  let metas = childs.map((child) => child.exposeProxy.getMeta())
  // childs.length = 0;
  metas.sort((a, b) => a.order - b.order)
  virtualRects = metas.map(() => ({}))
  calculate(metas, virtualRects)
  setTimeout(() => {
    if (isScrollBarVisibilityChange(root.value, width)) {
      calculate(metas, virtualRects)
    }
    root.value.style.overflow = 'hidden'
    render(virtualRects, metas)
    reflowedEvent.emit(instance)
    emit("reflowed");
  }, 0)
}

function isScrollBarVisibilityChange(el, lastClientWidth) {
  return lastClientWidth !== el.clientWidth
}

function calculate(metas, styles) {
  let options = getOptions()
  let processor = line.value === 'h' ? horizontalLineProcessor : verticalLineProcessor
  processor.calculate(options, metas, styles)
}

function getOptions() {
  const maxLGap = maxLineGap.value ? +maxLineGap.value : lineGap.value
  return {
    align: ~['left', 'right', 'center'].indexOf(align.value) ? align.value : 'left',
    line: ~['v', 'h'].indexOf(line.value) ? line.value : 'v',
    lineGap: +lineGap.value,
    minLineGap: minLineGap.value ? +minLineGap.value : lineGap.value,
    maxLineGap: maxLGap,
    singleMaxWidth: Math.max(singleMaxWidth.value || 0, maxLGap),
    fixedHeight: !!fixedHeight.value,
    grow: grow.value && grow.value.map(val => +val)
  }
}

let verticalLineProcessor = (() => {
  function calculate(options, metas, rects) {
    let width = instance.ctx.$el.clientWidth
    let grow = options.grow
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
  }

  function getRowStrategy(width, options) {
    let count = width / options.lineGap
    let slotWidth
    if (options.singleMaxWidth >= width) {
      count = 1
      //! 这里啥意思? 目的是什么
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

  function getRowStrategyWithGrow(width, grow) {
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
})()

let horizontalLineProcessor = (() => {

  function calculate(vm, options, metas, rects) {
    let width = vm.$el.clientWidth
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
    vm.style.height = top + 'px'
  }

  function getRowStrategy(width, options, metas, offset) {
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

  function getGreedyCount(rowWidth, rowHeight, metas, offset) {
    let count = 0
    for (let i = offset, width = 0; i < metas.length && width <= rowWidth; i++) {
      //! 按高度进行等比适配宽度
      width += metas[i].width * rowHeight / metas[i].height
      count++
    }
    return count
  }

  function getContentSize(rowWidth, options, metas, offset, count) {
    let originWidth = 0
    for (let i = count - 1; i >= 0; i--) {
      let meta = metas[offset + i]
      originWidth += meta.width * options.lineGap / meta.height
    }
    let fitHeight = options.lineGap * rowWidth / originWidth
    let canFit = (fitHeight <= options.maxLineGap && fitHeight >= options.minLineGap)
    if (canFit) {
      return {
        //?cost 这个是啥?
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

  function chooseFinalSize(lazySize, greedySize, rowWidth) {
    if (lazySize.cost === Infinity && greedySize.cost === Infinity) {
      return greedySize.width < rowWidth ? greedySize : lazySize
    } else {
      return greedySize.cost >= lazySize.cost ? lazySize : greedySize
    }
  }

  return {
    calculate
  }

})()

function getLeft(width, contentWidth, align) {
  switch (align) {
    case 'right':
      return width - contentWidth
    case 'center':
      return (width - contentWidth) / 2
    default:
      return 0
  }
}

function sum(arr) {
  return arr.reduce((sum, val) => sum + val)
}

function render(rects, metas) {
  let metasNeedToMoveByTransform = metas.filter((meta) => meta.moveClass)
  let firstRects = getRects(metasNeedToMoveByTransform)
  applyRects(rects, metas)
  let lastRects = getRects(metasNeedToMoveByTransform)
  metasNeedToMoveByTransform.forEach((meta, i) => {
    meta.node[MOVE_CLASS_PROP] = meta.moveClass
    setTransform(meta.node, firstRects[i], lastRects[i])
  })
  document.body.clientWidth // forced reflow
  metasNeedToMoveByTransform.forEach((meta) => {
    addClass(meta.node, meta.moveClass)
    clearTransform(meta.node)
  })
}

function getRects(metas) {
  return metas.map((meta) => meta.vm.rect)
}

function applyRects(rects, metas) {
  rects.forEach((rect, i) => {
    let style = metas[i].node.style
    metas[i].vm.rect = rect
    for (let prop in rect) {
      style[prop] = rect[prop] + 'px'
    }
  })
}

function setTransform(node, firstRect, lastRect) {
  let dx = firstRect.left - lastRect.left
  let dy = firstRect.top - lastRect.top
  let sw = firstRect.width / lastRect.width
  let sh = firstRect.height / lastRect.height
  node.style.transform =
    node.style.WebkitTransform = `translate(${dx}px,${dy}px) scale(${sw},${sh})`
  node.style.transitionDuration = '0s'
}

function clearTransform(node) {
  node.style.transform = node.style.WebkitTransform = ''
  node.style.transitionDuration = ''
}

function getTransitionEndEvent() {
  let isWebkitTrans =
    window.ontransitionend === undefined &&
    window.onwebkittransitionend !== undefined
  let transitionEndEvent = isWebkitTrans
    ? 'webkitTransitionEnd'
    : 'transitionend'
  return transitionEndEvent
}

/**
 * util
 */
function getArrayFillWith(item, count) {
  let getter = (typeof item === 'function') ? () => item() : () => item
  let arr = []
  for (let i = 0; i < count; i++) {
    arr[i] = getter()
  }
  return arr
}

function addClass(elem, name) {
  if (!hasClass(elem, name)) {
    let cur = attr(elem, 'class').trim()
    let res = (cur + ' ' + name).trim()
    attr(elem, 'class', res)
  }
}

function removeClass(elem, name) {
  let reg = new RegExp('\\s*\\b' + name + '\\b\\s*', 'g')
  let res = attr(elem, 'class').replace(reg, ' ').trim()
  attr(elem, 'class', res)
}

function hasClass(elem, name) {
  return (new RegExp('\\b' + name + '\\b')).test(attr(elem, 'class'))
}

function attr(elem, name, value) {
  if (typeof value !== 'undefined') {
    elem.setAttribute(name, value)
  } else {
    return elem.getAttribute(name) || ''
  }
}

function on(elem, type, listener, useCapture = false) {
  elem.addEventListener(type, listener, useCapture)
}

function off(elem, type, listener, useCapture = false) {
  elem.removeEventListener(type, listener, useCapture)
}

</script>

![preview](vue-waterfall.jpg)

> Because [vue-waterfall](https://github.com/moptym/vue-waterfall) last update was 6 years ago, and naturally did not support Vue3. I have now supported Vue3 based on the previous code. 🎉

** Adjust point: **
- The upgrade to Vue3 setup 🚀
- Written with Typescript
- Webpack switch to vite packaging

> At present, there is no adjustment of the layout algorithm, and the performance adjustment code may be optimized later.

# vue-waterfall

[![Build Status](https://img.shields.io/travis/MopTym/vue-waterfall.svg?style=flat-square)](https://travis-ci.org/MopTym/vue-waterfall)
[![Version](https://img.shields.io/npm/v/vue-waterfall.svg?style=flat-square)](https://www.npmjs.com/package/vue-waterfall)
[![License](https://img.shields.io/npm/l/vue-waterfall.svg?style=flat-square)](LICENSE)

A waterfall layout component for Vue.js .

## Demo

- [Vertical line](http://app.moptym.com/vue-waterfall/demo/vertical-line.html)
- [Horizontal line](http://app.moptym.com/vue-waterfall/demo/horizontal-line.html)
- [Vertical line with grow](http://app.moptym.com/vue-waterfall/demo/vertical-line-with-grow.html) [There is still some problem]

## Installation

```shell
npm install --save vue-waterfall
```

## Usage

Vue-waterfall is a [UMD](https://github.com/umdjs/umd) module, which can be used as a module in both CommonJS and AMD modular environments. When in non-modular environment, `Waterfall` will be registered as a global variable.

### Import

#### ES6

```js
/* in xxx.vue */

import { Waterfall, WaterfallSlot } from 'vue-waterfall3'
export default {
  ...
  components: {
    Waterfall,
    WaterfallSlot
  },
  ...
}
```

#### ES5

```js
var Vue = require('vue')
var VueWaterfall = require('vue-waterfall3')

var YourComponent = Vue.extend({
  ...
  components: {
    'waterfall': VueWaterfall.Waterfall,
    'waterfall-slot': VueWaterfall.WaterfallSlot
  },
  ...
})
```

#### Browser

```html
<script src="path/to/vue/vue.min.js"></script>
<script src="path/to/vue-waterfall/vue-waterfall.umd.js"></script>
```

```js
new Vue({
  ...
  components: {
    'waterfall': VueWaterfall.Waterfall,
    'waterfall-slot': VueWaterfall.WaterfallSlot
  },
  ...
})
```

### HTML structure

```html
<waterfall :line-gap="200" :watch="items">
  <!-- each component is wrapped by a waterfall slot -->
  <waterfall-slot
    v-for="(item, index) in items"
    :width="item.width"
    :height="item.height"
    :order="index"
    :key="item.id"
  >
    <!--
      your component
    -->
  </waterfall-slot>
</waterfall>
```

## Props

### waterfall

<table>
    <thead>
        <tr>
            <th width="160">Name</th>
            <th width="160">Default</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>line</td>
            <td><code>v</code></td>
            <td><code>v</code> or <code>h</code> . Line direction.</td>
        </tr>
        <tr>
            <td>line-gap</td>
            <td>-</td>
            <td>Required. The standard space (px) between lines.</td>
        </tr>
        <tr>
            <td>min-line-gap</td>
            <td>= line-gap</td>
            <td>The minimal space between lines.</td>
        </tr>
        <tr>
            <td>max-line-gap</td>
            <td>= line-gap</td>
            <td>The maximal space between lines.</td>
        </tr>
        <tr>
            <td>single-max-width</td>
            <td>= max-line-gap</td>
            <td>The maximal width of slot which is single in horizontal direction.</td>
        </tr>
        <tr>
            <td>fixed-height</td>
            <td><code>false</code></td>
            <td>Fix slot height when line = <code>v</code> .</td>
        </tr>
        <tr>
            <td>grow</td>
            <td>-</td>
            <td>Number Array. Slot flex grow factors in horizontal direction when line = <code>v</code> . Ignore <code>*-gap</code> .</td>
        </tr>
        <tr>
            <td>align</td>
            <td><code>left</code></td>
            <td><code>left</code> or <code>right</code> or <code>center</code> . Alignment.</td>
        </tr>
        <tr>
            <td>auto-resize</td>
            <td><code>true</code></td>
            <td>Reflow when window size changes.</td>
        </tr>
        <tr>
            <td>interval</td>
            <td><code>200</code></td>
            <td>The minimal time interval (ms) between reflow actions.</td>
        </tr>
        <tr>
            <td>watch</td>
            <td><code>{}</code></td>
            <td>Watch something, reflow when it changes.</td>
        </tr>
    </tbody>
</table>


### waterfall-slot

<table>
    <thead>
        <tr>
            <th width="160">Name</th>
            <th width="160">Default</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>width</td>
            <td>-</td>
            <td>Required. The width of slot.</td>
        </tr>
        <tr>
            <td>height</td>
            <td>-</td>
            <td>Required. The height of slot.</td>
        </tr>
        <tr>
            <td>order</td>
            <td><code>0</code></td>
            <td>The order of slot, often be set to <code>index</code> in <code>v-for</code> .</td>
        </tr>
        <tr>
            <td>key</td>
            <td><code>''</code></td>
            <td>The unique identification of slot, required for transition.</td>
        </tr>
        <tr>
            <td>move-class</td>
            <td>-</td>
            <td>Class for transition. see <a href="https://github.com/vuejs/vue-animated-list" target="_blank">vue-animated-list</a> .</td>
        </tr>
    </tbody>
</table>

## Transition

Inspired by [vue-animated-list](https://github.com/vuejs/vue-animated-list) , vue-waterfall supports moving elements with `translate` in transition, click on the [demo](http://app.moptym.com/vue-waterfall/demo/vertical-line.html) page to see it.

vue-waterfall has not supported `<transition-group>` in Vue 2 ( [#10](https://github.com/MopTym/vue-waterfall/issues/10) ) .

![preview](shuffle.gif)

## Events

```js
ON ( 'reflow' ) {
  reflow
}
// trigger reflow action: waterfallVm.$emit('reflow')
```

```js
AFTER ( reflow ) {
  emit 'reflowed'
}
// waterfallVm.$on('reflowed', () => { console.log('reflowed') })
```

## Reactivity

```js
WHEN ( layout property changes ) { /* line, line-gap, etc. */
  reflow
}
```

```js
WHEN ( slot changes ) { /* add, remove, etc. */
  reflow
}
```

## License

Released under the [MIT](LICENSE) License.

## 

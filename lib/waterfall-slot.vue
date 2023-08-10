<template>
  <div class="vue-waterfall-slot"
       v-show="isShow">
    <slot></slot>
  </div>
</template>

<style>
.vue-waterfall-slot {
  position: absolute;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>

<script setup lang="ts">
import { ref, watch, getCurrentInstance, nextTick, onMounted, onUnmounted } from "vue";
import { reflowEvent, reflowedEvent } from "./common"

const instance = getCurrentInstance();

type Props = {
  width: number,
  height: number,
  order?: number,
  moveClass?: string
}

const { width, height, order, moveClass } = withDefaults(defineProps<Props>(), {
  order: 0,
  moveClass: "",
});

const isShow = ref<boolean>(false);

function notify() {
  nextTick(() => {
    reflowEvent.emit(instance);
  });
}

console.log("vue-waterfall-slot");

function getMeta() {
  return {
    vm: instance,
    node: instance.ctx.$el,
    order: order,
    width: width,
    height: height,
    moveClass: moveClass
  }
}

onMounted(() => {
  instance.rect = {
    top: 0,
    left: 0,
    width: 0,
    height: 0
  }
  watch(() => (
    width,
    height
  ), notify)

  reflowedEvent.once(() => {
    isShow.value = true
  });
  notify()
})

onUnmounted(() => {
  notify()
})

defineExpose({
  getMeta
});

</script>

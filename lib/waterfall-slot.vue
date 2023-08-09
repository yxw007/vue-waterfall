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
import { ref, watch, getCurrentInstance, onMounted, onUnmounted } from "vue";
import { useEventBus } from '@vueuse/core'
import { waterfallReflowKey, waterfallReflowedKey } from "./common"

const instance = getCurrentInstance();
const reflowEvent = useEventBus(waterfallReflowKey);
const reflowedEvent = useEventBus(waterfallReflowedKey);

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

const data = ref({
  isShow: false
});

function notify() {
  reflowEvent.emit(instance);
}

function getMeta() {
  return {
    vm: instance,
    node: instance.$el,
    order: instance.order,
    width: instance.width,
    height: instance.height,
    moveClass: instance.moveClass
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

</script>

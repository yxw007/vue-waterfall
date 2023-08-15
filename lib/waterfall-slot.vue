<template>
  <div class="vue-waterfall-slot"
       ref="root"
       v-show="isShow">
    <slot></slot>
  </div>
</template>


<script setup lang="ts">
import { ref, watch, getCurrentInstance, nextTick, onMounted, onUnmounted } from "vue";
import { ChildInstance, reflowEvent, reflowedEvent } from "./common"

const instance: ChildInstance = getCurrentInstance();
const root = ref(null);

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
    reflowEvent.emit(instance as any);
  });
}

onMounted(() => {
  watch(() => [width, height], notify)
  reflowedEvent.once(() => {
    isShow.value = true
  });
  notify();
})

onUnmounted(() => {
  notify()
})

</script>

<style>
.vue-waterfall-slot {
  position: absolute;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>

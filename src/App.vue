<template>
	<div>
		<waterfall :align="align"
							 :line-gap="200"
							 :min-line-gap="100"
							 :max-line-gap="220"
							 :single-max-width="300"
							 :watch="items"
							 @reflowed="reflowed"
							 ref="waterfall">
			<!-- each component is wrapped by a waterfall slot -->
			<waterfall-slot v-for="(item, index) in items"
											:width="item.width"
											:height="item.height"
											:order="index"
											:key="item.index"
											move-class="item-move">
				<div class="item"
						 :style="item.style"
						 :index="item.index"></div>
			</waterfall-slot>
		</waterfall>
	</div>
</template>

<script setup lang="ts">
import { waterfall, waterfallSlot } from "./index"
import { ItemFactory } from "";
const items = ref();
</script>

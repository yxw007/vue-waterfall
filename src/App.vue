<template>
	<div class="wrapper"
			 @click="shuffle">
		<waterfall :align="align"
							 :line-gap="200"
							 :min-line-gap="100"
							 :max-line-gap="220"
							 :single-max-width="300"
							 :datas="items"
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

<script>
import { waterfall, waterfallSlot } from "../lib/index"
import ItemFactory from "../demo/common/js/item-factory";

export default {
	components: {
		waterfall, waterfallSlot
	},
	data: () => ({
		align: 'center',
		items: ItemFactory.get(100),
		isBusy: false
	}),
	created() {
		let self = this;
		window.addEventListener('scroll', function () {
			var scrollTop = document.documentElement.scrollTop || document.body.scrollTop
			if (scrollTop + window.innerHeight >= document.body.clientHeight) {
				self.addItems()
			}
		})
	},
	methods: {
		addItems() {
			if (!this.isBusy && this.items.length < 500) {
				this.isBusy = true
				this.items.push.apply(this.items, ItemFactory.get(50))
			}
		},
		shuffle() {
			debugger
			console.log("pre");
			console.log(this.items);
			this.items.sort(function () {
				return Math.random() - 0.8
			})
			console.log("after");
			console.log(this.items);
		},
		reflowed() {
			this.isBusy = false
		}
	}
}
</script>

<style>
</style>

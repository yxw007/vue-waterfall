<template>
	<div class="wrapper"
			 @click="shuffle">
		<Waterfall :align="align"
							 :line-gap="200"
							 :min-line-gap="100"
							 :max-line-gap="220"
							 :single-max-width="300"
							 :datas="items"
							 @reflowed="reflowed"
							 ref="waterfall">
			<WaterfallSlot v-for="(item, index) in items"
										 :width="item.width"
										 :height="item.height"
										 :order="index"
										 :key="item.index"
										 move-class="item-move">
				<div class="item"
						 :style="item.style"
						 :index="item.index"></div>
			</WaterfallSlot>
		</Waterfall>
	</div>
</template>

<script>
import { Waterfall, WaterfallSlot } from "../lib/index"
import ItemFactory from "../demo/common/js/item-factory";

export default {
	components: {
		Waterfall, WaterfallSlot
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
			this.items.sort(function () {
				return Math.random() - 0.8
			})
		},
		reflowed() {
			this.isBusy = false
		}
	}
}
</script>

<style>
</style>

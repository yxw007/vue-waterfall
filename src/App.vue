<template>
	<div class="wrapper">
		<waterfall :align="align"
							 :line-gap="285"
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

<script>
import { waterfall, waterfallSlot } from "./index"
import ItemFactory from "../demo/common/js/item-factory";

export default {
	components: {
		waterfall, waterfallSlot
	},
	data: () => ({
		align: 'left',
		items: ItemFactory.get(40),
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
				return Math.random() - 0.5
			})
		},
		reflowed() {
			this.isBusy = false
		}
	}
}
</script>

<style>
.item {
	margin-right: 30px;
	margin-bottom: 30px;
}
</style>

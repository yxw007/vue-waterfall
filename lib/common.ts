import type { EventBusKey } from '@vueuse/core'

export const waterfallReflowKey: EventBusKey<string> = Symbol('waterfallReflow')
export const waterfallReflowedKey: EventBusKey<string> = Symbol('waterfallReflow')
export type Align = "left" | "right" | "center";



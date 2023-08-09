import type { EventBusKey } from '@vueuse/core'
import { useEventBus } from '@vueuse/core'

export const waterfallReflowKey: EventBusKey<string> = Symbol('waterfallReflow')
export const waterfallReflowedKey: EventBusKey<string> = Symbol('waterfallReflow')
export type Align = "left" | "right" | "center";

export const reflowEvent = useEventBus(waterfallReflowKey);
export const reflowedEvent = useEventBus(waterfallReflowedKey);



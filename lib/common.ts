import type { EventBusKey } from '@vueuse/core'
import { useEventBus } from '@vueuse/core'
import { ComponentInternalInstance } from 'vue';


export const waterfallReflowKey: EventBusKey<string> = Symbol('waterfallReflow')
export const waterfallReflowedKey: EventBusKey<string> = Symbol('waterfallReflow')
export type Align = "left" | "right" | "center";
export type Line = "v" | "h";
export type ChildInstance = (ComponentInternalInstance & { rect?: Rect }) | null;
export type Meta = { vm: ChildInstance, node: HTMLElement, order: number, width: number, height: number, moveClass: string };
export type Rect = {
	width: number,
	height: number,
	left: number,
	top: number,
	[key: string]: any | undefined,
};

export const reflowEvent = useEventBus(waterfallReflowKey);
export const reflowedEvent = useEventBus(waterfallReflowedKey);


export function on(elem: EventTarget | null, type: string, listener: EventListenerOrEventListenerObject, useCapture: boolean = false) {
	if (elem) {
		elem.addEventListener(type, listener, useCapture)
	}
}

export function off(elem: EventTarget | null, type: string, listener: EventListenerOrEventListenerObject, useCapture: boolean = false) {
	if (elem) {
		elem.removeEventListener(type, listener, useCapture)
	}
}

function addClass(elem: HTMLElement, name: string) {
	if (!hasClass(elem, name)) {
		let cur = attr(elem, 'class').trim()
		let res = (cur + ' ' + name).trim()
		attr(elem, 'class', res)
	}
}

function removeClass(elem: HTMLElement, name: string) {
	let reg = new RegExp('\\s*\\b' + name + '\\b\\s*', 'g')
	let res = attr(elem, 'class')?.replace(reg, ' ').trim()
	attr(elem, 'class', res)
}

function hasClass(elem: HTMLElement, name: string) {
	return (new RegExp('\\b' + name + '\\b')).test(attr(elem, 'class'))
}

function attr(elem: HTMLElement, name: string, value?: string) {
	if (typeof value !== 'undefined') {
		elem.setAttribute(name, value)
		return ""
	} else {
		return elem.getAttribute(name) || ""
	}
}

export {
	addClass,
	removeClass,
	hasClass,
	attr
}

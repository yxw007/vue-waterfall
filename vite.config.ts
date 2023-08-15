import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

const isBuild = process.argv.includes("build");

const devConfig = () => defineConfig({
	plugins: [vue()],
});

const libConfig = () => defineConfig({
	plugins: [vue(), dts()],
	build: {
		sourcemap: false,
		lib: {
			entry: resolve(__dirname, "lib/index.ts"),
			name: "VueWaterfall",
			fileName: "vue-waterfall"
		},
		rollupOptions: {
			external: ["vue"],
			output: {
				globals: {
					vue: 'Vue',
				},
			},
		}
	}
});

export default isBuild ? libConfig() : devConfig();

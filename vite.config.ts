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
		target: 'es2015',
		sourcemap: true,
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			name: "VueWaterfall"
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

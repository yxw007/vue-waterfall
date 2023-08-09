import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			"@": resolve(__dirname, "src")
		},
		extensions: [".mjs", ".js", ".mts", ".jsx", ".json", ".vue", ".svg", ".png", ".jpg", ".jpeg"]
	},
})

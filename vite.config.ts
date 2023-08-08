import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import path from "path";

const pcwd: string = process.cwd();
// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			"@": path.join(pcwd, "src")
		},
		extensions: [".mjs", ".js", ".mts", ".jsx", ".json", ".vue", ".svg", ".png", ".jpg", ".jpeg"]
	},
})

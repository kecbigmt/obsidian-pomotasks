import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import autoPreprocess from "svelte-preprocess";
import path from "path";
import builtins from "builtin-modules";

const prod = process.argv[2] === "production";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		svelte({
			preprocess: autoPreprocess(),
		}),
	],
	build: {
		sourcemap: prod ? false : "inline",
		minify: prod,
		commonjsOptions: {
			ignoreTryCatch: false,
		},
		lib: {
			entry: path.resolve(__dirname, "src/main.ts"),
			formats: ["cjs"],
		},
		rollupOptions: {
			output: {
				entryFileNames: "main.js",
				assetFileNames: "styles.css",
			},
			external: [
				"obsidian",
				"electron",
				"@codemirror/autocomplete",
				"@codemirror/collab",
				"@codemirror/commands",
				"@codemirror/language",
				"@codemirror/lint",
				"@codemirror/search",
				"@codemirror/state",
				"@codemirror/view",
				"@lezer/common",
				"@lezer/highlight",
				"@lezer/lr",
				...builtins,
			],
		},
    emptyOutDir: false,
    outDir: '.',
	},
});

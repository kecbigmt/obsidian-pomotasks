import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import autoPreprocess from "svelte-preprocess";
import path from "path";
import builtins from "builtin-modules";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
	plugins: [
		svelte({
			preprocess: autoPreprocess(),
		}),
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
	},
	build: {
		target: "es2018",
		sourcemap: mode === 'production' ? false : "inline",
		minify: mode === 'production',
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
			treeshake: true,
		},
    emptyOutDir: false,
    outDir: '.',
	},
}));

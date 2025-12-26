import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib'),
			$components: path.resolve('./src/lib/components'),
			$stores: path.resolve('./src/lib/stores'),
			$utils: path.resolve('./src/lib/utils'),
			$types: path.resolve('./src/lib/types'),
			'$app/environment': path.resolve('./tests/__mocks__/$app-environment.ts'),
			'$app/navigation': path.resolve('./tests/__mocks__/$app-navigation.ts'),
			'$app/stores': path.resolve('./tests/__mocks__/$app-stores.ts')
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
		exclude: ['tests/e2e/**', 'tests/mobile/**', '**/*.spec.js'],
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./tests/setup.ts'],
		server: {
			deps: {
				inline: ['$app']
			}
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'tests/',
				'*.config.ts'
			]
		}
	}
});

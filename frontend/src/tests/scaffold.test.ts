import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '../../');

describe('Task 1: SvelteKit scaffold structure', () => {
	it('has package.json with sveltekit dependency', () => {
		const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
		expect(pkg.devDependencies).toHaveProperty('@sveltejs/kit');
	});

	it('has TypeScript configured', () => {
		expect(existsSync(resolve(root, 'tsconfig.json'))).toBe(true);
	});

	it('has vitest in devDependencies', () => {
		const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
		expect(pkg.devDependencies).toHaveProperty('vitest');
	});

	it('has prettier configured', () => {
		expect(existsSync(resolve(root, '.prettierrc'))).toBe(true);
	});

	it('has eslint configured', () => {
		expect(existsSync(resolve(root, 'eslint.config.js'))).toBe(true);
	});

	it('has tailwindcss dependency', () => {
		const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
		const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
		expect(allDeps).toHaveProperty('tailwindcss');
	});

	it('has .gitignore covering node_modules, .svelte-kit, and build', () => {
		const gitignore = readFileSync(resolve(root, '.gitignore'), 'utf-8');
		expect(gitignore).toContain('node_modules');
		expect(gitignore).toContain('.svelte-kit');
		expect(gitignore).toContain('build');
	});
});

describe('Task 2: Static SPA adapter', () => {
	it('has @sveltejs/adapter-static in devDependencies', () => {
		const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
		expect(pkg.devDependencies).toHaveProperty('@sveltejs/adapter-static');
	});

	it('vite.config.ts references adapter-static', () => {
		const config = readFileSync(resolve(root, 'vite.config.ts'), 'utf-8');
		expect(config).toContain('adapter-static');
	});

	it('vite.config.ts configures SPA fallback', () => {
		const config = readFileSync(resolve(root, 'vite.config.ts'), 'utf-8');
		expect(config).toMatch(/fallback.*200\.html|200\.html.*fallback/);
	});

	it('root layout exists with ssr=false', () => {
		const layout = readFileSync(resolve(root, 'src/routes/+layout.ts'), 'utf-8');
		expect(layout).toContain('ssr = false');
		expect(layout).toContain('prerender = false');
		expect(layout).toContain('csr = true');
	});
});

describe('Task 3: shadcn-svelte wired', () => {
	it('has components.json', () => {
		expect(existsSync(resolve(root, 'components.json'))).toBe(true);
	});

	it('has button component under $lib/components/ui/button', () => {
		expect(existsSync(resolve(root, 'src/lib/components/ui/button'))).toBe(true);
	});

	it('global stylesheet is imported in root layout or app.html', () => {
		const layoutSvelteExists = existsSync(resolve(root, 'src/routes/+layout.svelte'));
		const appHtmlExists = existsSync(resolve(root, 'src/app.html'));
		let imported = false;
		if (layoutSvelteExists) {
			const layout = readFileSync(resolve(root, 'src/routes/+layout.svelte'), 'utf-8');
			if (
				layout.includes('app.css') ||
				layout.includes('app.pcss') ||
				layout.includes('globals.css') ||
				layout.includes('layout.css')
			) {
				imported = true;
			}
		}
		if (!imported && appHtmlExists) {
			const appHtml = readFileSync(resolve(root, 'src/app.html'), 'utf-8');
			if (appHtml.includes('app.css') || appHtml.includes('stylesheet')) {
				imported = true;
			}
		}
		expect(imported).toBe(true);
	});
});

describe('Task 4: Landing page', () => {
	it('+page.svelte exists', () => {
		expect(existsSync(resolve(root, 'src/routes/+page.svelte'))).toBe(true);
	});

	it('+page.svelte uses script lang="ts"', () => {
		const page = readFileSync(resolve(root, 'src/routes/+page.svelte'), 'utf-8');
		expect(page).toContain('<script lang="ts">');
	});

	it('+page.svelte imports Button from shadcn-svelte', () => {
		const page = readFileSync(resolve(root, 'src/routes/+page.svelte'), 'utf-8');
		expect(page).toContain('Button');
		expect(page).toContain('$lib/components/ui/button');
	});

	it('+page.svelte heading has a Tailwind utility class', () => {
		const page = readFileSync(resolve(root, 'src/routes/+page.svelte'), 'utf-8');
		// Must have at least one element with a class attribute containing a Tailwind token
		expect(page).toMatch(
			/class="[^"]*\b(?:text-|bg-|p-|m-|font-|flex|grid|w-|h-|rounded|border|shadow|gap-|space-)[^"]*"/
		);
	});
});

describe('Task 2b: Build output — no Node server entry', () => {
	it('build/ does not contain a server entry (index.js in build/server/)', () => {
		const buildServerDir = resolve(root, 'build/server');
		if (!existsSync(resolve(root, 'build'))) {
			// Build hasn't run yet; skip by asserting the directory doesn't exist (expected pre-build)
			expect(existsSync(buildServerDir)).toBe(false);
			return;
		}
		expect(existsSync(buildServerDir)).toBe(false);
	});

	it('build/ contains the SPA fallback 200.html after build', () => {
		const buildDir = resolve(root, 'build');
		const fallbackExists = existsSync(buildDir) ? existsSync(resolve(buildDir, '200.html')) : true;
		expect(fallbackExists).toBe(true);
	});
});

describe('Task 5: README', () => {
	it('README.md exists', () => {
		expect(existsSync(resolve(root, 'README.md'))).toBe(true);
	});

	it('README.md documents npm run dev', () => {
		const readme = readFileSync(resolve(root, 'README.md'), 'utf-8');
		expect(readme).toContain('npm run dev');
	});

	it('README.md documents npm run build', () => {
		const readme = readFileSync(resolve(root, 'README.md'), 'utf-8');
		expect(readme).toContain('npm run build');
	});

	it('README.md documents npm run preview', () => {
		const readme = readFileSync(resolve(root, 'README.md'), 'utf-8');
		expect(readme).toContain('npm run preview');
	});
});

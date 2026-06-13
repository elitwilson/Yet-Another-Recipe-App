import { error } from '@sveltejs/kit';
import { fetchRecipe } from '$lib/api/recipes';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const id = Number(params.id);
	if (Number.isNaN(id)) {
		error(404, 'Recipe not found');
	}

	try {
		const recipe = await fetchRecipe(id);
		return { recipe };
	} catch (e) {
		const message = e instanceof Error ? e.message : '';
		if (message.includes('404')) {
			error(404, 'Recipe not found');
		}
		error(500, 'Failed to load recipe');
	}
};

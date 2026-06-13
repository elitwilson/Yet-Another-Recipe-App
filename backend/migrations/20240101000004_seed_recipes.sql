INSERT INTO recipes (title, servings, total_time, tags, favorite, ingredients, steps, notes, source)
VALUES
(
    'Garlic Butter Weeknight Pasta',
    4,
    25,
    ARRAY['pasta', 'fast', 'vegetarian'],
    TRUE,
    '[
        {"qty": "400", "unit": "g", "item": "spaghetti"},
        {"qty": "6", "unit": "cloves", "item": "garlic, thinly sliced"},
        {"qty": "5", "unit": "tbsp", "item": "butter"},
        {"qty": "2", "unit": "tbsp", "item": "olive oil"},
        {"qty": "1/2", "unit": "tsp", "item": "chili flakes"},
        {"qty": "1", "unit": "handful", "item": "parsley, chopped"},
        {"qty": "50", "unit": "g", "item": "parmesan, grated"},
        {"qty": "", "unit": "", "item": "salt and pepper to taste"}
    ]'::jsonb,
    ARRAY[
        'Boil the spaghetti in well-salted water until al dente. Reserve a cup of pasta water.',
        'Melt butter with olive oil over low heat. Add garlic and chili flakes; cook gently until fragrant.',
        'Toss drained pasta in the garlic butter, adding pasta water until glossy.',
        'Off the heat, stir through parmesan and parsley. Season and serve.'
    ],
    ARRAY[]::text[],
    '{"type": "paste", "host": "pasted text", "method": "parsed from text"}'::jsonb
),
(
    'Crispy Sheet-Pan Gnocchi & Greens',
    4,
    30,
    ARRAY['sheet-pan', 'fast', 'vegetarian'],
    FALSE,
    '[
        {"qty": "500", "unit": "g", "item": "shelf-stable gnocchi"},
        {"qty": "250", "unit": "g", "item": "cherry tomatoes"},
        {"qty": "1", "unit": "", "item": "broccoli, cut into florets"},
        {"qty": "3", "unit": "tbsp", "item": "olive oil"},
        {"qty": "2", "unit": "cloves", "item": "garlic, sliced"},
        {"qty": "50", "unit": "g", "item": "parmesan, grated"},
        {"qty": "1", "unit": "tsp", "item": "chili flakes"}
    ]'::jsonb,
    ARRAY[
        'Heat oven to 230°C. Toss gnocchi, tomatoes, and broccoli with oil, garlic, and chili.',
        'Spread on a sheet pan in a single layer.',
        'Roast 22–25 minutes, tossing once, until gnocchi are crisp.',
        'Shower with parmesan and serve from the pan.'
    ],
    ARRAY[]::text[],
    '{"type": "url", "host": "seriousweeknight.com", "url": "https://seriousweeknight.com/sheet-pan-gnocchi", "method": "schema.org Recipe (JSON-LD)"}'::jsonb
),
(
    'Red Lentil & Coconut Soup',
    6,
    40,
    ARRAY['soup', 'batch', 'vegan'],
    FALSE,
    '[
        {"qty": "1", "unit": "cup", "item": "red lentils, rinsed"},
        {"qty": "1", "unit": "can", "item": "coconut milk"},
        {"qty": "1", "unit": "tbsp", "item": "red curry paste"},
        {"qty": "1", "unit": "", "item": "onion, diced"},
        {"qty": "3", "unit": "cloves", "item": "garlic, minced"},
        {"qty": "4", "unit": "cups", "item": "vegetable stock"}
    ]'::jsonb,
    ARRAY[
        'Soften onion, garlic, and ginger in a little oil.',
        'Stir in curry paste; cook a minute until fragrant.',
        'Add lentils, stock, and coconut milk. Simmer 25 minutes.',
        'Blend partially, finish with lime, and season.'
    ],
    ARRAY[]::text[],
    '{"type": "url", "host": "thecozykitchen.net", "url": "https://thecozykitchen.net/red-lentil-soup", "method": "schema.org Recipe (JSON-LD)"}'::jsonb
),
(
    'Weekend Shakshuka',
    2,
    35,
    ARRAY['brunch', 'eggs', 'vegetarian'],
    TRUE,
    '[
        {"qty": "1", "unit": "can", "item": "whole peeled tomatoes"},
        {"qty": "4", "unit": "", "item": "eggs"},
        {"qty": "1", "unit": "", "item": "onion, diced"},
        {"qty": "1", "unit": "", "item": "red pepper, diced"},
        {"qty": "2", "unit": "cloves", "item": "garlic, minced"},
        {"qty": "1", "unit": "tsp", "item": "cumin"},
        {"qty": "1", "unit": "tsp", "item": "smoked paprika"}
    ]'::jsonb,
    ARRAY[
        'Soften onion and pepper, then add garlic and spices.',
        'Pour in tomatoes, crush, and simmer until thick.',
        'Make wells, crack in eggs, cover and cook until just set.',
        'Finish with herbs and good bread.'
    ],
    ARRAY[]::text[],
    '{"type": "manual", "host": "entered by hand", "method": "manual entry"}'::jsonb
)
ON CONFLICT (title) DO NOTHING;

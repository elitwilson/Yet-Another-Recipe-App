// data.js — seed recipes + a real (lightweight) recipe parser.
// The parser is deliberately heuristic & deterministic: it shows how
// pasted/free text becomes structured fields, and flags low-confidence
// lines so the review step has something to do.

const UNITS = [
  'cups','cup','c','tablespoons','tablespoon','tbsp','tbs','tbl','teaspoons','teaspoon','tsp',
  'grams','gram','g','kilograms','kilogram','kg','milliliters','milliliter','ml','liters','liter','l',
  'ounces','ounce','oz','pounds','pound','lb','lbs','pinch','pinches','dash','dashes',
  'cloves','clove','cans','can','sticks','stick','slices','slice','pieces','piece','bunch','bunches',
  'sprigs','sprig','heads','head','handful','handfuls','packages','package','pkg','quarts','quart','qt',
  'pints','pint','pt','gallons','gallon','fl','sheets','sheet','knob','strips','strip','wedges','wedge'
];
const UNIT_RE = new RegExp('^(' + UNITS.join('|') + ')\\.?$', 'i');
const QTY_RE = /^(\d+\s*\d?\/\d|\d+[.,]?\d*|\d+|[½⅓⅔¼¾⅛⅜⅝⅞]|\d+\s*[½⅓⅔¼¾⅛⅜⅝⅞]|\d+\s*-\s*\d+|\d+\s*to\s*\d+)/i;

const INGREDIENT_HEADER = /^\s*(ingredients?|you'?ll need|what you need|shopping list)\s*:?\s*$/i;
const STEP_HEADER = /^\s*(instructions?|directions?|method|steps?|preparation|to make|to prepare|procedure)\s*:?\s*$/i;
const NOTES_HEADER = /^\s*(notes?|tips?)\s*:?\s*$/i;

function cleanBullet(s) {
  return s.replace(/^\s*[-*•·–—▢▪◦]\s*/, '').replace(/^\s*\d+[.)]\s*/, '').replace(/^\s*step\s*\d+\s*[:.)-]?\s*/i, '').trim();
}

// Parse one ingredient line into {qty, unit, item}
function parseIngredient(rawIn) {
  const raw = cleanBullet(rawIn);
  let rest = raw, qty = '', unit = '';
  const qm = raw.match(QTY_RE);
  if (qm) {
    qty = qm[0].replace(/\s+/g, ' ').trim();
    rest = raw.slice(qm[0].length).trim();
    const words = rest.split(/\s+/);
    if (words.length && UNIT_RE.test(words[0])) {
      unit = words[0].replace(/\.$/, '');
      rest = words.slice(1).join(' ');
    }
  }
  const item = rest.replace(/^of\s+/i, '').trim();
  const lowConf = !qty && !/salt|pepper|oil|to taste|garnish|water/i.test(item);
  return { qty, unit, item: item || raw, raw, lowConf };
}

function looksLikeIngredient(line) {
  const l = cleanBullet(line);
  if (!l) return false;
  if (QTY_RE.test(l)) return true;
  const words = l.split(/\s+/);
  if (words.length <= 6 && /^(salt|pepper|olive oil|butter|garlic|water|flour|sugar|eggs?|milk)/i.test(l)) return true;
  return false;
}

function detectMeta(text) {
  const out = {};
  const serv = text.match(/serves?\s*(\d+)|(\d+)\s*servings?|yields?\s*(\d+)|makes?\s+(?:enough\s+for\s+)?(\d+)/i);
  if (serv) out.servings = parseInt(serv[1] || serv[2] || serv[3] || serv[4], 10);
  const time = text.match(/(\d+)\s*(?:hours?|hrs?|hr)\s*(?:(\d+)\s*(?:minutes?|mins?))?|(\d+)\s*(?:minutes?|mins?|min)\b/i);
  if (time) {
    if (time[1]) out.totalTime = parseInt(time[1], 10) * 60 + (time[2] ? parseInt(time[2], 10) : 0);
    else if (time[3]) out.totalTime = parseInt(time[3], 10);
  }
  return out;
}

// Split an inline comma list ("a, b (x, y), c and d") into items, respecting parens.
function splitInlineList(str) {
  const parts = []; let cur = '', depth = 0;
  for (const ch of str) {
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  const out = [];
  parts.forEach((p) => p.split(/\s+and\s+(?![^(]*\))/i).forEach((x) => { if (x.trim()) out.push(x.trim()); }));
  return out.filter(Boolean);
}

// Push prose split into sentences as separate steps.
function pushSentences(str, arr) {
  str.split(/(?<=[.!?])\s+(?=[A-Za-z0-9])/).map((s) => cleanBullet(s))
    .filter((s) => s && !/^(done|enjoy|that'?s it|finished)\.?$/i.test(s))
    .forEach((p) => arr.push(p));
}

// Main parser. Returns a structured draft + warnings + confidence.
function parseRecipeText(text) {
  const lines = (text || '').replace(/\r/g, '').split('\n').map((l) => l.replace(/\s+$/, ''));
  const nonEmpty = lines.map((l, i) => ({ l: l.trim(), i })).filter((x) => x.l);
  if (!nonEmpty.length) return null;

  let ingStart = -1, stepStart = -1, notesStart = -1;
  lines.forEach((l, i) => {
    if (ingStart === -1 && INGREDIENT_HEADER.test(l)) ingStart = i;
    else if (stepStart === -1 && STEP_HEADER.test(l)) stepStart = i;
    else if (notesStart === -1 && NOTES_HEADER.test(l)) notesStart = i;
  });

  // Title: first non-empty line that isn't a header
  let title = '';
  for (const { l } of nonEmpty) {
    if (INGREDIENT_HEADER.test(l) || STEP_HEADER.test(l)) continue;
    if (QTY_RE.test(cleanBullet(l))) break;
    if (l.length <= 80) { title = l.replace(/[:#*]+$/, '').replace(/^#+\s*/, '').trim(); }
    break;
  }

  const meta = detectMeta(text);
  let ingredients = [], steps = [], notes = [];
  const warnings = [];

  if (ingStart !== -1) {
    // Header-driven: between ingredient header and the next section
    const ingEnd = [stepStart, notesStart].filter((x) => x > ingStart).sort((a, b) => a - b)[0] ?? lines.length;
    for (let i = ingStart + 1; i < ingEnd; i++) {
      if (lines[i].trim()) ingredients.push(parseIngredient(lines[i]));
    }
    const stepEnd = (notesStart > stepStart ? notesStart : lines.length);
    if (stepStart !== -1) {
      for (let i = stepStart + 1; i < stepEnd; i++) {
        const s = cleanBullet(lines[i]);
        if (s) steps.push(s);
      }
    }
    if (notesStart !== -1) {
      for (let i = notesStart + 1; i < lines.length; i++) {
        const s = cleanBullet(lines[i]);
        if (s) notes.push(s);
      }
    }
  } else {
    // No headers: handle inline headers, comma-lists, and prose.
    const body = nonEmpty.filter(({ l }) => l !== title);
    for (const { l } of body) {
      const inlineIng = l.match(/^\s*(you'?ll need|you need|ingredients?|shopping list|grocery list)\s*[:\-–]\s*(.+)$/i);
      if (inlineIng) { splitInlineList(inlineIng[2]).forEach((it) => ingredients.push(parseIngredient(it))); continue; }
      const inlineStep = l.match(/^\s*(instructions?|directions?|method|steps?|to make|to prepare)\s*[:\-–]\s*(.+)$/i);
      if (inlineStep) { pushSentences(inlineStep[2], steps); continue; }
      const bare = cleanBullet(l);
      const prose = bare.split(/\s+/).length >= 7 && !QTY_RE.test(bare);
      // skip a leading chatty greeting before any real content
      if (!ingredients.length && !steps.length && prose && /\b(hey|hi|hello|here'?s|so|okay|ok|this is|here is)\b/i.test(l)) continue;
      if (looksLikeIngredient(l) && !prose) { ingredients.push(parseIngredient(l)); continue; }
      if (prose || /^\d+[.)]/.test(l)) { pushSentences(bare, steps); continue; }
      ingredients.push(parseIngredient(l));
    }
    warnings.push('No "Ingredients"/"Instructions" headings found — split was guessed. Worth a quick check.');
  }

  // If steps came as one big paragraph, split into sentences
  if (steps.length === 1 && steps[0].length > 160) {
    steps = steps[0].split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
  }

  const lowCount = ingredients.filter((x) => x.lowConf).length;
  if (lowCount) warnings.push(`${lowCount} ingredient line${lowCount > 1 ? 's' : ''} had no clear quantity.`);
  if (!steps.length) warnings.push('No steps detected.');
  if (!title) warnings.push('No title detected — add one before saving.');

  // Confidence score (0–100)
  let conf = 50;
  if (ingStart !== -1) conf += 25;
  if (title) conf += 10;
  if (steps.length) conf += 10;
  conf -= lowCount * 4;
  conf = Math.max(20, Math.min(98, conf));

  return {
    title: title || '',
    servings: meta.servings || null,
    totalTime: meta.totalTime || null,
    ingredients,
    steps,
    notes,
    warnings,
    confidence: conf,
  };
}

/* ------------------------------------------------------------------ *
 * Sample texts for the paste flow (clean + messy/LLM)
 * ------------------------------------------------------------------ */
const SAMPLE_PASTE_CLEAN = `Garlic Butter Weeknight Pasta
Serves 4 · 25 minutes

Ingredients:
- 400 g spaghetti
- 6 cloves garlic, thinly sliced
- 5 tbsp butter
- 2 tbsp olive oil
- 1/2 tsp chili flakes
- 1 handful parsley, chopped
- 50 g parmesan, grated
- salt and pepper to taste

Instructions:
1. Boil the spaghetti in well-salted water until al dente. Reserve a cup of pasta water.
2. Melt the butter with the olive oil over low heat. Add the garlic and chili flakes and cook gently until fragrant, about 2 minutes.
3. Toss the drained pasta in the garlic butter, adding splashes of pasta water until glossy.
4. Off the heat, stir through parmesan and parsley. Season and serve.`;

const SAMPLE_PASTE_MESSY = `hey! here's that sheet pan chicken thing i was telling you about, makes enough for 2 of us with leftovers

you need: chicken thighs (like 6, bone in), a couple sweet potatoes cut into chunks, a red onion, olive oil, smoked paprika maybe a tablespoon, garlic powder, salt, half a lemon

throw everything on a tray, toss with the oil and spices, roast at 220C for like 35-40 min until the chicken skin is crispy. squeeze the lemon over at the end. done`;

/* ------------------------------------------------------------------ *
 * URL import simulation — keyed canned results w/ schema.org provenance
 * ------------------------------------------------------------------ */
const URL_FIXTURES = [
  {
    match: /taco|mexican|salsa/i,
    host: 'cooking-with-mara.com',
    recipe: {
      title: 'Charred Corn & Black Bean Tacos',
      servings: 4, totalTime: 30,
      ingredients: [
        { qty: '2', unit: 'cups', item: 'corn kernels (fresh or frozen)' },
        { qty: '1', unit: 'can', item: 'black beans, drained and rinsed' },
        { qty: '8', unit: '', item: 'corn tortillas' },
        { qty: '1', unit: '', item: 'red onion, finely diced' },
        { qty: '1', unit: '', item: 'lime, juiced' },
        { qty: '1', unit: 'handful', item: 'cilantro, chopped' },
        { qty: '1', unit: 'tsp', item: 'smoked paprika' },
        { qty: '', unit: '', item: 'salt and pepper to taste' },
      ],
      steps: [
        'Char the corn in a dry skillet over high heat until blistered, 5–6 minutes.',
        'Add black beans and smoked paprika; warm through and season.',
        'Char the tortillas directly over the flame or in the skillet.',
        'Fill tortillas, top with red onion, cilantro, and a squeeze of lime.',
      ],
    },
  },
  {
    match: /soup|stew|lentil|curry/i,
    host: 'thecozykitchen.net',
    recipe: {
      title: 'Red Lentil & Coconut Soup',
      servings: 6, totalTime: 40,
      ingredients: [
        { qty: '1', unit: 'cup', item: 'red lentils, rinsed' },
        { qty: '1', unit: 'can', item: 'coconut milk' },
        { qty: '1', unit: 'tbsp', item: 'red curry paste' },
        { qty: '1', unit: '', item: 'onion, diced' },
        { qty: '3', unit: 'cloves', item: 'garlic, minced' },
        { qty: '1', unit: 'knob', item: 'ginger, grated' },
        { qty: '4', unit: 'cups', item: 'vegetable stock' },
        { qty: '1', unit: '', item: 'lime, juiced' },
      ],
      steps: [
        'Soften the onion, garlic, and ginger in a little oil.',
        'Stir in the curry paste and cook for a minute until fragrant.',
        'Add lentils, stock, and coconut milk. Simmer 25 minutes until lentils collapse.',
        'Blend partially for body, finish with lime juice, and season.',
      ],
    },
  },
  {
    match: /.*/, // default
    host: 'seriousweeknight.com',
    recipe: {
      title: 'Crispy Sheet-Pan Gnocchi & Greens',
      servings: 4, totalTime: 30,
      ingredients: [
        { qty: '500', unit: 'g', item: 'shelf-stable gnocchi' },
        { qty: '250', unit: 'g', item: 'cherry tomatoes' },
        { qty: '1', unit: '', item: 'broccoli, cut into florets' },
        { qty: '3', unit: 'tbsp', item: 'olive oil' },
        { qty: '2', unit: 'cloves', item: 'garlic, sliced' },
        { qty: '50', unit: 'g', item: 'parmesan, grated' },
        { qty: '1', unit: 'tsp', item: 'chili flakes' },
      ],
      steps: [
        'Heat oven to 230°C. Toss gnocchi, tomatoes, and broccoli with oil, garlic, and chili.',
        'Spread on a sheet pan in a single layer.',
        'Roast 22–25 minutes, tossing once, until gnocchi are crisp and tomatoes burst.',
        'Shower with parmesan and serve straight from the pan.',
      ],
    },
  },
];

function importFromUrl(url) {
  const fx = URL_FIXTURES.find((f) => f.match.test(url)) || URL_FIXTURES[URL_FIXTURES.length - 1];
  let host = fx.host;
  try { host = new URL(url.startsWith('http') ? url : 'https://' + url).hostname.replace(/^www\./, ''); } catch (e) {}
  return {
    ...JSON.parse(JSON.stringify(fx.recipe)),
    confidence: 96,
    warnings: [],
    notes: [],
    source: { type: 'url', url: url.startsWith('http') ? url : 'https://' + url, host, method: 'schema.org Recipe (JSON-LD)' },
  };
}

/* ------------------------------------------------------------------ *
 * Seed library
 * ------------------------------------------------------------------ */
function uid() { return 'r_' + Math.random().toString(36).slice(2, 9); }

const SEED_RECIPES = [
  {
    id: uid(), title: 'Garlic Butter Weeknight Pasta', servings: 4, totalTime: 25,
    tags: ['pasta', 'fast', 'vegetarian'], favorite: true,
    source: { type: 'paste', host: 'pasted text', method: 'parsed from text' },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    ingredients: [
      { qty: '400', unit: 'g', item: 'spaghetti' },
      { qty: '6', unit: 'cloves', item: 'garlic, thinly sliced' },
      { qty: '5', unit: 'tbsp', item: 'butter' },
      { qty: '2', unit: 'tbsp', item: 'olive oil' },
      { qty: '1/2', unit: 'tsp', item: 'chili flakes' },
      { qty: '1', unit: 'handful', item: 'parsley, chopped' },
      { qty: '50', unit: 'g', item: 'parmesan, grated' },
      { qty: '', unit: '', item: 'salt and pepper to taste' },
    ],
    steps: [
      'Boil the spaghetti in well-salted water until al dente. Reserve a cup of pasta water.',
      'Melt butter with olive oil over low heat. Add garlic and chili flakes; cook gently until fragrant.',
      'Toss drained pasta in the garlic butter, adding pasta water until glossy.',
      'Off the heat, stir through parmesan and parsley. Season and serve.',
    ],
  },
  {
    id: uid(), title: 'Crispy Sheet-Pan Gnocchi & Greens', servings: 4, totalTime: 30,
    tags: ['sheet-pan', 'fast', 'vegetarian'], favorite: false,
    source: { type: 'url', host: 'seriousweeknight.com', url: 'https://seriousweeknight.com/sheet-pan-gnocchi', method: 'schema.org Recipe (JSON-LD)' },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    ingredients: [
      { qty: '500', unit: 'g', item: 'shelf-stable gnocchi' },
      { qty: '250', unit: 'g', item: 'cherry tomatoes' },
      { qty: '1', unit: '', item: 'broccoli, cut into florets' },
      { qty: '3', unit: 'tbsp', item: 'olive oil' },
      { qty: '2', unit: 'cloves', item: 'garlic, sliced' },
      { qty: '50', unit: 'g', item: 'parmesan, grated' },
      { qty: '1', unit: 'tsp', item: 'chili flakes' },
    ],
    steps: [
      'Heat oven to 230°C. Toss gnocchi, tomatoes, and broccoli with oil, garlic, and chili.',
      'Spread on a sheet pan in a single layer.',
      'Roast 22–25 minutes, tossing once, until gnocchi are crisp.',
      'Shower with parmesan and serve from the pan.',
    ],
  },
  {
    id: uid(), title: 'Red Lentil & Coconut Soup', servings: 6, totalTime: 40,
    tags: ['soup', 'batch', 'vegan'], favorite: false,
    source: { type: 'url', host: 'thecozykitchen.net', url: 'https://thecozykitchen.net/red-lentil-soup', method: 'schema.org Recipe (JSON-LD)' },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 9,
    ingredients: [
      { qty: '1', unit: 'cup', item: 'red lentils, rinsed' },
      { qty: '1', unit: 'can', item: 'coconut milk' },
      { qty: '1', unit: 'tbsp', item: 'red curry paste' },
      { qty: '1', unit: '', item: 'onion, diced' },
      { qty: '3', unit: 'cloves', item: 'garlic, minced' },
      { qty: '4', unit: 'cups', item: 'vegetable stock' },
    ],
    steps: [
      'Soften onion, garlic, and ginger in a little oil.',
      'Stir in curry paste; cook a minute until fragrant.',
      'Add lentils, stock, and coconut milk. Simmer 25 minutes.',
      'Blend partially, finish with lime, and season.',
    ],
  },
  {
    id: uid(), title: 'Weekend Shakshuka', servings: 2, totalTime: 35,
    tags: ['brunch', 'eggs', 'vegetarian'], favorite: true,
    source: { type: 'manual', host: 'entered by hand', method: 'manual entry' },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    ingredients: [
      { qty: '1', unit: 'can', item: 'whole peeled tomatoes' },
      { qty: '4', unit: '', item: 'eggs' },
      { qty: '1', unit: '', item: 'onion, diced' },
      { qty: '1', unit: '', item: 'red pepper, diced' },
      { qty: '2', unit: 'cloves', item: 'garlic, minced' },
      { qty: '1', unit: 'tsp', item: 'cumin' },
      { qty: '1', unit: 'tsp', item: 'smoked paprika' },
    ],
    steps: [
      'Soften onion and pepper, then add garlic and spices.',
      'Pour in tomatoes, crush, and simmer until thick.',
      'Make wells, crack in eggs, cover and cook until just set.',
      'Finish with herbs and good bread.',
    ],
  },
];

function fmtTime(min) {
  if (!min) return null;
  if (min < 60) return min + ' min';
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

Object.assign(window, {
  parseRecipeText, parseIngredient, importFromUrl, uid, fmtTime,
  SEED_RECIPES, SAMPLE_PASTE_CLEAN, SAMPLE_PASTE_MESSY,
});

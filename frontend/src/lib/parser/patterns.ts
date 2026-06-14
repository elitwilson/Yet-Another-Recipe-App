// Shared compiled regexes for recipe parsing.
// Keeping these in one place ensures quantity detection is consistent
// between parseIngredient and parseRecipeText.

// Matches a quantity at the start of a string.
// Alternation order matters — more specific patterns must come first:
//   1. range with "to" (e.g. 2 to 3) — before plain integer
//   2. range with dash (e.g. 35-40) — before plain integer
//   3. mixed number + ascii fraction (e.g. 1 1/2) — before plain integer
//   4. ascii fraction (e.g. 1/2) — before plain integer
//   5. mixed number + unicode fraction (e.g. 1 ½) — before plain integer
//   6. unicode fraction alone (e.g. ½)
//   7. decimal (e.g. 2.5, 2,5) — [.,]\d+ required to avoid matching just "2"
//   8. plain integer (e.g. 2) — catch-all last
export const QTY_RE =
	/^(\d+\s*to\s*\d+|\d+\s*-\s*\d+|\d+\s+\d\/\d|\d+\s*\d?\/\d|\d+\s*[½⅓⅔¼¾⅛⅜⅝⅞]|[½⅓⅔¼¾⅛⅜⅝⅞]|\d+[.,]\d+|\d+)/i;

// Section header patterns — case-insensitive, optional trailing colon.
export const INGREDIENT_HEADER =
	/^\s*(ingredients?|you'?ll need|what you need|shopping list)\s*:?\s*$/i;

export const STEP_HEADER =
	/^\s*(instructions?|directions?|method|steps?|preparation|to make|to prepare|procedure)\s*:?\s*$/i;

export const NOTES_HEADER = /^\s*(notes?|tips?)\s*:?\s*$/i;

// Inline header patterns — "you need: a, b, c" style.
// These appear on the same line as the ingredient list.
export const INLINE_INGREDIENT_HEADER =
	/^\s*(you'?ll need|you need|ingredients?|shopping list|grocery list)\s*[:\-–]\s*(.+)$/i;

export const INLINE_STEP_HEADER =
	/^\s*(instructions?|directions?|method|steps?|to make|to prepare)\s*[:\-–]\s*(.+)$/i;

CREATE TABLE recipes (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    servings    INT,
    total_time  INT,
    tags        TEXT[] NOT NULL DEFAULT '{}',
    favorite    BOOLEAN NOT NULL DEFAULT FALSE,
    ingredients JSONB NOT NULL DEFAULT '[]',
    steps       TEXT[] NOT NULL DEFAULT '{}',
    notes       TEXT[] NOT NULL DEFAULT '{}',
    source      JSONB NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT recipes_title_unique UNIQUE (title)
);

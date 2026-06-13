CREATE TABLE recipes (
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    CONSTRAINT recipes_name_unique UNIQUE (name)
);

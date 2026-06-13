use sqlx::PgPool;

use crate::recipes::model::{Ingredient, Recipe, RecipeInput, RecipeSource};

pub async fn list_recipes(pool: &PgPool) -> Result<Vec<Recipe>, sqlx::Error> {
    let rows = sqlx::query!(
        r#"
        SELECT
            id,
            title,
            servings,
            total_time,
            tags,
            favorite,
            ingredients as "ingredients: sqlx::types::Json<Vec<Ingredient>>",
            steps,
            notes,
            source as "source: sqlx::types::Json<RecipeSource>",
            created_at
        FROM recipes
        ORDER BY id
        "#
    )
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|r| Recipe {
            id: r.id,
            title: r.title,
            servings: r.servings,
            total_time: r.total_time,
            tags: r.tags,
            favorite: r.favorite,
            ingredients: r.ingredients.0,
            steps: r.steps,
            notes: r.notes,
            source: r.source.0,
            created_at: r.created_at,
        })
        .collect())
}

pub async fn get_recipe(pool: &PgPool, id: i32) -> Result<Recipe, sqlx::Error> {
    let r = sqlx::query!(
        r#"
        SELECT
            id,
            title,
            servings,
            total_time,
            tags,
            favorite,
            ingredients as "ingredients: sqlx::types::Json<Vec<Ingredient>>",
            steps,
            notes,
            source as "source: sqlx::types::Json<RecipeSource>",
            created_at
        FROM recipes
        WHERE id = $1
        "#,
        id
    )
    .fetch_one(pool)
    .await?;

    Ok(Recipe {
        id: r.id,
        title: r.title,
        servings: r.servings,
        total_time: r.total_time,
        tags: r.tags,
        favorite: r.favorite,
        ingredients: r.ingredients.0,
        steps: r.steps,
        notes: r.notes,
        source: r.source.0,
        created_at: r.created_at,
    })
}

pub async fn create_recipe(pool: &PgPool, input: &RecipeInput) -> Result<Recipe, sqlx::Error> {
    let ingredients = sqlx::types::Json(&input.ingredients);
    let source = sqlx::types::Json(&input.source);

    let r = sqlx::query!(
        r#"
        INSERT INTO recipes (title, servings, total_time, tags, favorite, ingredients, steps, notes, source)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING
            id,
            title,
            servings,
            total_time,
            tags,
            favorite,
            ingredients as "ingredients: sqlx::types::Json<Vec<Ingredient>>",
            steps,
            notes,
            source as "source: sqlx::types::Json<RecipeSource>",
            created_at
        "#,
        input.title,
        input.servings,
        input.total_time,
        &input.tags,
        input.favorite,
        ingredients as _,
        &input.steps,
        &input.notes,
        source as _,
    )
    .fetch_one(pool)
    .await?;

    Ok(Recipe {
        id: r.id,
        title: r.title,
        servings: r.servings,
        total_time: r.total_time,
        tags: r.tags,
        favorite: r.favorite,
        ingredients: r.ingredients.0,
        steps: r.steps,
        notes: r.notes,
        source: r.source.0,
        created_at: r.created_at,
    })
}

pub async fn update_recipe(pool: &PgPool, id: i32, input: &RecipeInput) -> Result<Recipe, sqlx::Error> {
    let ingredients = sqlx::types::Json(&input.ingredients);
    let source = sqlx::types::Json(&input.source);

    let r = sqlx::query!(
        r#"
        UPDATE recipes
        SET title = $1, servings = $2, total_time = $3, tags = $4, favorite = $5,
            ingredients = $6, steps = $7, notes = $8, source = $9
        WHERE id = $10
        RETURNING
            id,
            title,
            servings,
            total_time,
            tags,
            favorite,
            ingredients as "ingredients: sqlx::types::Json<Vec<Ingredient>>",
            steps,
            notes,
            source as "source: sqlx::types::Json<RecipeSource>",
            created_at
        "#,
        input.title,
        input.servings,
        input.total_time,
        &input.tags,
        input.favorite,
        ingredients as _,
        &input.steps,
        &input.notes,
        source as _,
        id,
    )
    .fetch_one(pool)
    .await?;

    Ok(Recipe {
        id: r.id,
        title: r.title,
        servings: r.servings,
        total_time: r.total_time,
        tags: r.tags,
        favorite: r.favorite,
        ingredients: r.ingredients.0,
        steps: r.steps,
        notes: r.notes,
        source: r.source.0,
        created_at: r.created_at,
    })
}

pub async fn delete_recipe(pool: &PgPool, id: i32) -> Result<(), sqlx::Error> {
    let result = sqlx::query!("DELETE FROM recipes WHERE id = $1", id)
        .execute(pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(sqlx::Error::RowNotFound);
    }

    Ok(())
}

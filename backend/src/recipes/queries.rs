use sqlx::PgPool;

use crate::recipes::model::{Ingredient, Recipe, RecipeSource};

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

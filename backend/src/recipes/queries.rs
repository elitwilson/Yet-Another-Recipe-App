use sqlx::PgPool;

use crate::recipes::model::Recipe;

pub async fn list_recipes(pool: &PgPool) -> Result<Vec<Recipe>, sqlx::Error> {
    sqlx::query_as!(Recipe, "SELECT id, name FROM recipes ORDER BY id")
        .fetch_all(pool)
        .await
}

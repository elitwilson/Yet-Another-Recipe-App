use axum::{extract::State, Json};

use crate::{app::AppState, error::AppError, recipes::model::Recipe};

pub async fn list_recipes(State(state): State<AppState>) -> Result<Json<Vec<Recipe>>, AppError> {
    let recipes = sqlx::query_as!(Recipe, "SELECT id, name FROM recipes ORDER BY id")
        .fetch_all(&state.pool)
        .await?;
    Ok(Json(recipes))
}

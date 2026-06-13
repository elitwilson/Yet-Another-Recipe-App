use axum::{extract::State, Json};

use crate::{app::AppState, error::AppError, recipes::model::Recipe, recipes::queries};

pub async fn list_recipes(State(state): State<AppState>) -> Result<Json<Vec<Recipe>>, AppError> {
    let recipes = queries::list_recipes(&state.pool).await?;
    Ok(Json(recipes))
}

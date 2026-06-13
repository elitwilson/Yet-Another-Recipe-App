use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};

use crate::{
    app::AppState,
    error::AppError,
    recipes::model::{Recipe, RecipeInput},
    recipes::queries,
};

pub async fn list_recipes(State(state): State<AppState>) -> Result<Json<Vec<Recipe>>, AppError> {
    let recipes = queries::list_recipes(&state.pool).await?;
    Ok(Json(recipes))
}

pub async fn get_recipe(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<Recipe>, AppError> {
    let recipe = queries::get_recipe(&state.pool, id).await?;
    Ok(Json(recipe))
}

pub async fn create_recipe(
    State(state): State<AppState>,
    Json(input): Json<RecipeInput>,
) -> Result<(StatusCode, Json<Recipe>), AppError> {
    let recipe = queries::create_recipe(&state.pool, &input).await?;
    Ok((StatusCode::CREATED, Json(recipe)))
}

pub async fn update_recipe(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    Json(input): Json<RecipeInput>,
) -> Result<Json<Recipe>, AppError> {
    let recipe = queries::update_recipe(&state.pool, id, &input).await?;
    Ok(Json(recipe))
}

pub async fn delete_recipe(
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<StatusCode, AppError> {
    queries::delete_recipe(&state.pool, id).await?;
    Ok(StatusCode::NO_CONTENT)
}

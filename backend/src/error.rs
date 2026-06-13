use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

pub enum AppError {
    Database(sqlx::Error),
}

impl From<sqlx::Error> for AppError {
    fn from(e: sqlx::Error) -> Self {
        AppError::Database(e)
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let AppError::Database(e) = self;
        eprintln!("database error: {e}");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": "internal server error" })),
        )
            .into_response()
    }
}

#[cfg(test)]
mod tests;

use axum::http::StatusCode;

pub async fn health() -> StatusCode {
    StatusCode::OK
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn health_returns_200() {
        let status = health().await;
        assert_eq!(status, StatusCode::OK);
    }
}

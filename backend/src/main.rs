use tokio::net::TcpListener;
use yara_backend::{
    app::{create_router_with_state, AppState},
    config::Config,
    db::create_pool,
};

#[tokio::main]
async fn main() {
    let config = Config::from_env();

    let pool = match create_pool(&config.database_url).await {
        Ok(p) => p,
        Err(err) => {
            eprintln!(
                "error: failed to connect to database (DATABASE_URL={}): {err}",
                config.database_url
            );
            std::process::exit(1);
        }
    };

    let state = AppState::new(pool);
    let addr = format!("{}:{}", config.host, config.port);
    let listener = TcpListener::bind(&addr).await.unwrap();
    eprintln!("Listening on http://{addr}");
    axum::serve(listener, create_router_with_state(state))
        .await
        .unwrap();
}

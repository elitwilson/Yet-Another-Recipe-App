use tokio::net::TcpListener;
use yara_backend::{app::create_router, config::Config};

#[tokio::main]
async fn main() {
    let config = Config::from_env();
    let addr = format!("{}:{}", config.host, config.port);
    let listener = TcpListener::bind(&addr).await.unwrap();
    eprintln!("Listening on http://{addr}");
    axum::serve(listener, create_router()).await.unwrap();
}

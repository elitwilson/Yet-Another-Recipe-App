pub struct Config {
    pub host: String,
    pub port: u16,
    pub database_url: String,
}

impl Config {
    pub fn from_env() -> Self {
        let host = std::env::var("YARA_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
        let port = match std::env::var("YARA_PORT") {
            Ok(val) => val
                .parse::<u16>()
                .unwrap_or_else(|_| panic!("YARA_PORT must be a valid port number, got: {val}")),
            Err(_) => 3000,
        };
        let database_url = std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgres://yara:yara@localhost:5432/yara".to_string());
        Self {
            host,
            port,
            database_url,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    static ENV_LOCK: Mutex<()> = Mutex::new(());

    fn env_lock() -> std::sync::MutexGuard<'static, ()> {
        ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner())
    }

    #[test]
    fn uses_defaults_when_env_vars_unset() {
        let _guard = env_lock();
        std::env::remove_var("YARA_HOST");
        std::env::remove_var("YARA_PORT");
        std::env::remove_var("DATABASE_URL");
        let config = Config::from_env();
        assert_eq!(config.host, "127.0.0.1");
        assert_eq!(config.port, 3000);
        assert!(config.database_url.starts_with("postgres://"));
    }

    #[test]
    fn reads_host_from_env() {
        let _guard = env_lock();
        std::env::remove_var("YARA_PORT");
        std::env::set_var("YARA_HOST", "0.0.0.0");
        let config = Config::from_env();
        std::env::remove_var("YARA_HOST");
        assert_eq!(config.host, "0.0.0.0");
    }

    #[test]
    fn reads_port_from_env() {
        let _guard = env_lock();
        std::env::remove_var("YARA_HOST");
        std::env::set_var("YARA_PORT", "8080");
        let config = Config::from_env();
        std::env::remove_var("YARA_PORT");
        assert_eq!(config.port, 8080);
    }

    #[test]
    #[should_panic]
    fn panics_on_invalid_port() {
        let _guard = env_lock();
        std::env::set_var("YARA_PORT", "not-a-port");
        Config::from_env();
    }
}

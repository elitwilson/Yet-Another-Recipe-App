use std::fs;
use std::path::Path;

fn repo_root() -> std::path::PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("backend has a parent directory")
        .to_path_buf()
}

fn backend_dir() -> std::path::PathBuf {
    repo_root().join("backend")
}

fn frontend_dir() -> std::path::PathBuf {
    repo_root().join("frontend")
}

// ── Task 1: Backend image + migration-on-startup ─────────────────────────────

#[test]
fn backend_dockerfile_exists() {
    assert!(
        backend_dir().join("Dockerfile").exists(),
        "backend/Dockerfile must exist"
    );
}

#[test]
fn backend_dockerfile_uses_multistage_build() {
    let content = fs::read_to_string(backend_dir().join("Dockerfile"))
        .expect("backend/Dockerfile must be readable");
    let from_count = content
        .lines()
        .filter(|l| l.trim_start().starts_with("FROM"))
        .count();
    assert!(
        from_count >= 2,
        "backend/Dockerfile must use a multi-stage build (at least 2 FROM statements), found {}",
        from_count
    );
}

#[test]
fn backend_dockerfile_sets_sqlx_offline() {
    let content = fs::read_to_string(backend_dir().join("Dockerfile"))
        .expect("backend/Dockerfile must be readable");
    assert!(
        content.contains("SQLX_OFFLINE"),
        "backend/Dockerfile must set SQLX_OFFLINE=true so docker build needs no database"
    );
}

#[test]
fn backend_dockerfile_runs_release_build() {
    let content = fs::read_to_string(backend_dir().join("Dockerfile"))
        .expect("backend/Dockerfile must be readable");
    assert!(
        content.contains("--release"),
        "backend/Dockerfile must build with --release"
    );
}

#[test]
fn backend_dockerfile_copies_migrations() {
    let content = fs::read_to_string(backend_dir().join("Dockerfile"))
        .expect("backend/Dockerfile must be readable");
    assert!(
        content.contains("migrations"),
        "backend/Dockerfile must copy migrations directory into the runtime image"
    );
}

#[test]
fn backend_dockerfile_has_entrypoint_or_cmd() {
    let content = fs::read_to_string(backend_dir().join("Dockerfile"))
        .expect("backend/Dockerfile must be readable");
    assert!(
        content.contains("ENTRYPOINT") || content.contains("CMD"),
        "backend/Dockerfile must specify an ENTRYPOINT or CMD"
    );
}

#[test]
fn backend_dockerignore_exists() {
    assert!(
        backend_dir().join(".dockerignore").exists(),
        "backend/.dockerignore must exist"
    );
}

#[test]
fn backend_dockerignore_excludes_target_dir() {
    let content = fs::read_to_string(backend_dir().join(".dockerignore"))
        .expect("backend/.dockerignore must be readable");
    assert!(
        content.contains("target"),
        "backend/.dockerignore must exclude the target/ directory"
    );
}

#[test]
fn backend_entrypoint_script_exists() {
    assert!(
        backend_dir().join("docker-entrypoint.sh").exists(),
        "backend/docker-entrypoint.sh must exist"
    );
}

#[test]
fn backend_entrypoint_runs_migrations() {
    let content = fs::read_to_string(backend_dir().join("docker-entrypoint.sh"))
        .expect("backend/docker-entrypoint.sh must be readable");
    assert!(
        content.contains("migrate"),
        "backend/docker-entrypoint.sh must run database migrations"
    );
}

#[test]
fn backend_entrypoint_execs_server() {
    let content = fs::read_to_string(backend_dir().join("docker-entrypoint.sh"))
        .expect("backend/docker-entrypoint.sh must be readable");
    assert!(
        content.contains("exec"),
        "backend/docker-entrypoint.sh must exec the server binary so it becomes PID 1"
    );
}

// ── Task 2: Frontend image + single-origin nginx ─────────────────────────────

#[test]
fn frontend_dockerfile_exists() {
    assert!(
        frontend_dir().join("Dockerfile").exists(),
        "frontend/Dockerfile must exist"
    );
}

#[test]
fn frontend_dockerfile_uses_multistage_build() {
    let content = fs::read_to_string(frontend_dir().join("Dockerfile"))
        .expect("frontend/Dockerfile must be readable");
    let from_count = content
        .lines()
        .filter(|l| l.trim_start().starts_with("FROM"))
        .count();
    assert!(
        from_count >= 2,
        "frontend/Dockerfile must use a multi-stage build (Node build + nginx serve), found {}",
        from_count
    );
}

#[test]
fn frontend_dockerfile_runs_npm_build() {
    let content = fs::read_to_string(frontend_dir().join("Dockerfile"))
        .expect("frontend/Dockerfile must be readable");
    assert!(
        content.contains("npm") && content.contains("build"),
        "frontend/Dockerfile must run npm build to produce static output"
    );
}

#[test]
fn frontend_dockerfile_uses_nginx_serve_stage() {
    let content = fs::read_to_string(frontend_dir().join("Dockerfile"))
        .expect("frontend/Dockerfile must be readable");
    assert!(
        content.to_lowercase().contains("nginx"),
        "frontend/Dockerfile serve stage must use nginx"
    );
}

#[test]
fn frontend_dockerfile_copies_build_output() {
    let content = fs::read_to_string(frontend_dir().join("Dockerfile"))
        .expect("frontend/Dockerfile must be readable");
    assert!(
        content.contains("build"),
        "frontend/Dockerfile must copy the build/ output into the nginx image"
    );
}

#[test]
fn frontend_dockerignore_exists() {
    assert!(
        frontend_dir().join(".dockerignore").exists(),
        "frontend/.dockerignore must exist"
    );
}

#[test]
fn frontend_dockerignore_excludes_node_modules() {
    let content = fs::read_to_string(frontend_dir().join(".dockerignore"))
        .expect("frontend/.dockerignore must be readable");
    assert!(
        content.contains("node_modules"),
        "frontend/.dockerignore must exclude node_modules/"
    );
}

#[test]
fn frontend_nginx_conf_exists() {
    assert!(
        frontend_dir().join("nginx.conf").exists(),
        "frontend/nginx.conf must exist"
    );
}

#[test]
fn frontend_nginx_conf_proxies_api_to_backend() {
    let content = fs::read_to_string(frontend_dir().join("nginx.conf"))
        .expect("frontend/nginx.conf must be readable");
    assert!(
        content.contains("proxy_pass") && content.contains("/api"),
        "frontend/nginx.conf must proxy_pass /api to the backend service"
    );
}

#[test]
fn frontend_nginx_conf_has_spa_fallback() {
    let content = fs::read_to_string(frontend_dir().join("nginx.conf"))
        .expect("frontend/nginx.conf must be readable");
    // SvelteKit adapter-static uses 200.html (not index.html) as the SPA fallback
    assert!(
        content.contains("try_files")
            && (content.contains("index.html") || content.contains("200.html")),
        "frontend/nginx.conf must include try_files SPA fallback (index.html or 200.html)"
    );
}

#[test]
fn frontend_nginx_conf_proxies_to_backend_service_name() {
    let content = fs::read_to_string(frontend_dir().join("nginx.conf"))
        .expect("frontend/nginx.conf must be readable");
    assert!(
        content.contains("backend"),
        "frontend/nginx.conf must proxy /api to the 'backend' service name"
    );
}

// ── Task 3: Compose orchestration ────────────────────────────────────────────

#[test]
fn compose_defines_backend_service() {
    let content = fs::read_to_string(repo_root().join("docker-compose.yml"))
        .expect("docker-compose.yml must be readable");
    assert!(
        content.contains("backend:"),
        "docker-compose.yml must define a 'backend' service"
    );
}

#[test]
fn compose_defines_frontend_service() {
    let content = fs::read_to_string(repo_root().join("docker-compose.yml"))
        .expect("docker-compose.yml must be readable");
    assert!(
        content.contains("frontend:"),
        "docker-compose.yml must define a 'frontend' service"
    );
}

#[test]
fn compose_backend_has_database_url_pointing_to_postgres_service() {
    let content = fs::read_to_string(repo_root().join("docker-compose.yml"))
        .expect("docker-compose.yml must be readable");
    assert!(
        content.contains("DATABASE_URL") && content.contains("@postgres"),
        "docker-compose.yml backend must set DATABASE_URL pointing at the 'postgres' service name"
    );
}

#[test]
fn compose_backend_sets_yara_host_to_all_interfaces() {
    let content = fs::read_to_string(repo_root().join("docker-compose.yml"))
        .expect("docker-compose.yml must be readable");
    assert!(
        content.contains("YARA_HOST") && content.contains("0.0.0.0"),
        "docker-compose.yml must set YARA_HOST=0.0.0.0 so the backend is reachable within the Compose network"
    );
}

#[test]
fn compose_postgres_has_healthcheck() {
    let content = fs::read_to_string(repo_root().join("docker-compose.yml"))
        .expect("docker-compose.yml must be readable");
    assert!(
        content.contains("healthcheck") && content.contains("pg_isready"),
        "docker-compose.yml postgres service must have a pg_isready healthcheck"
    );
}

#[test]
fn compose_backend_depends_on_postgres_healthy() {
    let content = fs::read_to_string(repo_root().join("docker-compose.yml"))
        .expect("docker-compose.yml must be readable");
    assert!(
        content.contains("service_healthy"),
        "docker-compose.yml backend must depend on postgres with condition: service_healthy"
    );
}

#[test]
fn compose_frontend_depends_on_backend() {
    let content = fs::read_to_string(repo_root().join("docker-compose.yml"))
        .expect("docker-compose.yml must be readable");
    assert!(
        content.contains("depends_on"),
        "docker-compose.yml frontend must declare depends_on (backend)"
    );
}

#[test]
fn compose_frontend_publishes_port() {
    let content = fs::read_to_string(repo_root().join("docker-compose.yml"))
        .expect("docker-compose.yml must be readable");
    // The frontend service section should contain a ports mapping
    // We check the frontend section contains "ports:"
    let frontend_idx = content
        .find("frontend:")
        .expect("frontend service must exist");
    let after_frontend = &content[frontend_idx..];
    assert!(
        after_frontend.contains("ports:"),
        "docker-compose.yml frontend service must publish a host port"
    );
}

#[test]
fn root_env_example_documents_yara_host() {
    let content = fs::read_to_string(repo_root().join(".env.example"))
        .expect(".env.example must be readable");
    assert!(
        content.contains("YARA_HOST") || content.contains("backend"),
        "root .env.example must document backend host/port configuration"
    );
}

// ── Task 4: README ────────────────────────────────────────────────────────────

#[test]
fn root_readme_exists() {
    assert!(
        repo_root().join("README.md").exists(),
        "README.md must exist at repo root"
    );
}

#[test]
fn root_readme_documents_docker_compose_up() {
    let content =
        fs::read_to_string(repo_root().join("README.md")).expect("README.md must be readable");
    assert!(
        content.contains("docker compose up") || content.contains("docker-compose up"),
        "README.md must document the 'docker compose up' command"
    );
}

#[test]
fn root_readme_documents_prerequisites() {
    let content =
        fs::read_to_string(repo_root().join("README.md")).expect("README.md must be readable");
    let lower = content.to_lowercase();
    assert!(
        lower.contains("docker")
            && (lower.contains("prerequisite")
                || lower.contains("require")
                || lower.contains("install")),
        "README.md must document prerequisites (Docker)"
    );
}

#[test]
fn root_readme_documents_dev_workflow() {
    let content =
        fs::read_to_string(repo_root().join("README.md")).expect("README.md must be readable");
    let lower = content.to_lowercase();
    assert!(
        (lower.contains("cargo") || lower.contains("npm run dev")),
        "README.md must document per-service dev workflow"
    );
}

#[test]
fn root_readme_documents_where_to_open_browser() {
    let content =
        fs::read_to_string(repo_root().join("README.md")).expect("README.md must be readable");
    assert!(
        content.contains("localhost") || content.contains("http://"),
        "README.md must tell the user where to point their browser after docker compose up"
    );
}

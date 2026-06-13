# ── Builder stage ─────────────────────────────────────────────────────────────
FROM rust:1.87-slim AS builder

WORKDIR /build

# Install sqlx-cli for migration support in the entrypoint
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Pre-fetch dependencies (layer cache)
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo 'fn main(){}' > src/main.rs && \
    SQLX_OFFLINE=true cargo build --release --bin yara-backend && \
    rm -rf src

# Build the real binary
COPY src ./src
COPY .sqlx ./.sqlx
ENV SQLX_OFFLINE=true
RUN touch src/main.rs && cargo build --release --bin yara-backend

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM debian:bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libssl3 curl \
    && rm -rf /var/lib/apt/lists/*

# Install sqlx-cli for running migrations at startup
RUN curl -L https://github.com/launchbadge/sqlx/releases/download/v0.8.6/sqlx-cli-v0.8.6-x86_64-unknown-linux-gnu.tar.gz \
    | tar -xz -C /usr/local/bin sqlx \
    && chmod +x /usr/local/bin/sqlx

COPY --from=builder /build/target/release/yara-backend ./yara-backend
COPY migrations ./migrations
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]

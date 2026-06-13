# ── Builder stage ─────────────────────────────────────────────────────────────
FROM rust:1.88-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Build sqlx-cli in the builder stage — copied to runtime for the entrypoint
# migration runner. Faster than cargo-installing in the runtime image and
# avoids unreliable pre-built binary downloads from GitHub releases.
RUN cargo install sqlx-cli@0.8.3 --no-default-features --features native-tls,postgres

# Pre-fetch dependencies (layer cache)
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo 'fn main(){}' > src/main.rs && touch src/lib.rs && \
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
    ca-certificates libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Copy sqlx-cli built in the builder stage
COPY --from=builder /usr/local/cargo/bin/sqlx /usr/local/bin/sqlx

COPY --from=builder /build/target/release/yara-backend ./yara-backend
COPY migrations ./migrations
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]

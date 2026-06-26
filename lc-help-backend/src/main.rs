use axum::{
    extract::State,
    http::{Method, StatusCode},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool, Row};
use tower_http::cors::{Any, CorsLayer};
use dotenvy::dotenv;
use std::env;

// Structure for incoming submissions
#[derive(Debug, Deserialize, Serialize)]
struct ProblemPayload {
    title: String,
    initial_state: serde_json::Value,
    steps: serde_json::Value,
}

// Structure for outgoing database records (Adding the ID)
#[derive(Debug, Serialize)]
struct ProblemRecord {
    id: i32,
    title: String,
    initial_state: serde_json::Value,
    steps: serde_json::Value,
}

#[derive(Clone)]
struct AppState {
    db: PgPool,
}

#[tokio::main]
async fn main() {
    dotenv().ok();
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .expect("Failed to connect to Postgres.");

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS problems (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            initial_state JSONB NOT NULL,
            steps JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        "#,
    )
    .execute(&pool)
    .await
    .expect("Failed to create the 'problems' table");

    let state = AppState { db: pool };

    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_origin(Any)
        .allow_headers(Any);

    // Added the GET route for fetching problems
    let app = Router::new()
        .route("/", get(|| async { "lc.help.org API is active" }))
        .route("/api/problems", get(get_problems))
        .route("/api/problems/submit", post(submit_problem))
        .with_state(state)
        .layer(cors);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8000")
        .await
        .unwrap();

    println!("🚀 Backend running on http://127.0.0.1:8000");
    axum::serve(listener, app).await.unwrap();
}

// Handler: Submit a new problem (POST)
async fn submit_problem(
    State(state): State<AppState>,
    Json(payload): Json<ProblemPayload>,
) -> Result<(StatusCode, Json<serde_json::Value>), (StatusCode, String)> {

    let result = sqlx::query(
        "INSERT INTO problems (title, initial_state, steps) VALUES ($1, $2, $3) RETURNING id"
    )
    .bind(&payload.title)
    .bind(&payload.initial_state)
    .bind(&payload.steps)
    .fetch_one(&state.db)
    .await;

    match result {
        Ok(record) => {
            let id: i32 = record.get("id");
            let response = serde_json::json!({
                "status": "success",
                "message": "Problem saved to database!",
                "problem_id": id
            });
            Ok((StatusCode::CREATED, Json(response)))
        }
        Err(e) => {
            eprintln!("Database error: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to save problem".to_string()))
        }
    }
}

// NEW Handler: Fetch all pending problems for moderators (GET)
async fn get_problems(
    State(state): State<AppState>,
) -> Result<Json<Vec<ProblemRecord>>, (StatusCode, String)> {

    let rows = sqlx::query("SELECT id, title, initial_state, steps FROM problems ORDER BY id DESC")
        .fetch_all(&state.db)
        .await
        .map_err(|e| {
            eprintln!("Database fetch error: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch problems".to_string())
        })?;

    let mut problems = Vec::new();

    for row in rows {
        problems.push(ProblemRecord {
            id: row.get("id"),
            title: row.get("title"),
            initial_state: row.get("initial_state"),
            steps: row.get("steps"),
        });
    }

    Ok(Json(problems))
}


use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

// 1. Define the spatial/logical state structures
#[derive(Serialize, Deserialize)]
pub struct NodeState {
    id: String,
    status: String, // e.g., "queued", "visited", "evaluating"
}

#[derive(Serialize, Deserialize)]
pub struct AnimationFrame {
    step: usize,
    description: String,
    nodes: Vec<NodeState>,
    queue: Vec<String>,
}

// 2. Expose the engine to JavaScript
#[wasm_bindgen]
pub fn execute_dry_run(script: &str) -> String {
    // In a real scenario, you would parse the `script` here.
    // For this boilerplate, we are hardcoding a 2-step BFS queue simulation.
    let mut timeline: Vec<AnimationFrame> = Vec::new();

    // Frame 0: Initial State
    timeline.push(AnimationFrame {
        step: 0,
        description: "Initialize Queue with root node A".to_string(),
        nodes: vec![
            NodeState { id: "A".to_string(), status: "queued".to_string() },
            NodeState { id: "B".to_string(), status: "unvisited".to_string() },
            NodeState { id: "C".to_string(), status: "unvisited".to_string() },
        ],
        queue: vec!["A".to_string()],
    });

    // Frame 1: Dequeue A, Enqueue B and C
    timeline.push(AnimationFrame {
        step: 1,
        description: "Dequeue A, add neighbors B and C to queue".to_string(),
        nodes: vec![
            NodeState { id: "A".to_string(), status: "visited".to_string() },
            NodeState { id: "B".to_string(), status: "queued".to_string() },
            NodeState { id: "C".to_string(), status: "queued".to_string() },
        ],
        queue: vec!["B".to_string(), "C".to_string()],
    });

    // 3. Serialize the Rust Vec directly to a JSON string for JS to consume
    serde_json::to_string(&timeline).unwrap_or_else(|_| "[]".to_string())
}

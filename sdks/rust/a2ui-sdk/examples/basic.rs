//! Basic A2UI SDK usage example.

use a2ui_sdk::{JSONPointer, Transport, TransportOptions};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Example 1: JSON Pointer usage
    println!("=== JSON Pointer Example ===");

    let data = json!({
        "user": {
            "name": "Alice",
            "age": 30,
            "address": {
                "city": "NYC"
            }
        }
    });

    let jp = JSONPointer;

    // Resolve values
    if let Some(name) = jp.resolve(&data, "/user/name")? {
        println!("Name: {}", name);
    }

    if let Some(city) = jp.resolve(&data, "/user/address/city")? {
        println!("City: {}", city);
    }

    // Example 2: Transport connection (placeholder)
    println!("\n=== Transport Example ===");

    let mut transport = Transport::new("ws://localhost:8000", Some(TransportOptions::default()));

    println!("Connecting to agent...");
    transport.connect().await?;
    println!("Connected! Status: {:?}", transport.status());

    transport.disconnect().await?;
    println!("Disconnected!");

    Ok(())
}

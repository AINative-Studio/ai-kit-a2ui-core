//! File upload handling example.

use a2ui_sdk::JSONPointer;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== File Upload Handler Example ===");

    // Simulate file upload component in data model
    let mut data = json!({
        "upload": {
            "status": "pending",
            "progress": 0,
            "file": null
        }
    });

    let jp = JSONPointer;

    // Update upload progress
    println!("Starting upload...");
    jp.set(&mut data, "/upload/status", json!("uploading"))?;
    jp.set(&mut data, "/upload/progress", json!(25))?;
    println!("Progress: {}%", data["upload"]["progress"]);

    // Simulate progress updates
    for progress in [50, 75, 100] {
        jp.set(&mut data, "/upload/progress", json!(progress))?;
        println!("Progress: {}%", progress);
    }

    // Complete upload
    jp.set(&mut data, "/upload/status", json!("complete"))?;
    jp.set(
        &mut data,
        "/upload/file",
        json!({
            "name": "document.pdf",
            "size": 1024000,
            "type": "application/pdf"
        }),
    )?;

    println!("\nUpload complete!");
    println!("File: {}", data["upload"]["file"]);

    Ok(())
}

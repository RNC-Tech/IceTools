use serde_json::json;

pub fn check() -> Result<serde_json::Value, String> {
    Ok(json!({
        "updateAvailable": false,
        "version": env!("CARGO_PKG_VERSION")
    }))
}

pub fn download() -> Result<serde_json::Value, String> {
    Ok(json!({ "success": true }))
}

pub fn install() -> Result<serde_json::Value, String> {
    Ok(json!({ "success": true }))
}

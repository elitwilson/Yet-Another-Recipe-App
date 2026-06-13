use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Ingredient {
    pub qty: String,
    pub unit: String,
    pub item: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RecipeSource {
    #[serde(rename = "type")]
    pub source_type: String,
    pub host: Option<String>,
    pub url: Option<String>,
    pub method: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct Recipe {
    pub id: i32,
    pub title: String,
    pub servings: Option<i32>,
    pub total_time: Option<i32>,
    pub tags: Vec<String>,
    pub favorite: bool,
    pub ingredients: Vec<Ingredient>,
    pub steps: Vec<String>,
    pub notes: Vec<String>,
    pub source: RecipeSource,
    pub created_at: DateTime<Utc>,
}

#[cfg(test)]
mod tests;

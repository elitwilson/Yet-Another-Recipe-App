use super::{Ingredient, Recipe, RecipeSource};
use chrono::Utc;

#[test]
fn recipe_serializes_all_production_fields() {
    let r = Recipe {
        id: 1,
        title: "Garlic Butter Weeknight Pasta".to_string(),
        servings: Some(4),
        total_time: Some(25),
        tags: vec!["pasta".to_string(), "fast".to_string()],
        favorite: true,
        ingredients: vec![
            Ingredient {
                qty: "400".to_string(),
                unit: "g".to_string(),
                item: "spaghetti".to_string(),
            },
            Ingredient {
                qty: "".to_string(),
                unit: "".to_string(),
                item: "salt and pepper to taste".to_string(),
            },
        ],
        steps: vec!["Boil pasta.".to_string()],
        notes: vec![],
        source: RecipeSource {
            source_type: "paste".to_string(),
            host: Some("pasted text".to_string()),
            url: None,
            method: Some("parsed from text".to_string()),
        },
        created_at: Utc::now(),
    };

    let json = serde_json::to_string(&r).unwrap();
    let val: serde_json::Value = serde_json::from_str(&json).unwrap();

    assert_eq!(val["id"], 1);
    assert_eq!(val["title"], "Garlic Butter Weeknight Pasta");
    assert_eq!(val["servings"], 4);
    assert_eq!(val["total_time"], 25);
    assert_eq!(val["favorite"], true);
    assert_eq!(val["tags"][0], "pasta");
    assert_eq!(val["ingredients"][0]["qty"], "400");
    assert_eq!(val["ingredients"][0]["unit"], "g");
    assert_eq!(val["ingredients"][0]["item"], "spaghetti");
    assert_eq!(val["ingredients"][1]["qty"], "");
    assert_eq!(val["steps"][0], "Boil pasta.");
    assert!(val["notes"].as_array().unwrap().is_empty());
    assert_eq!(val["source"]["type"], "paste");
    assert_eq!(val["source"]["host"], "pasted text");
    assert!(val["source"]["url"].is_null());
    assert!(val["created_at"].is_string());
}

#[test]
fn recipe_nullable_fields_serialize_as_null() {
    let r = Recipe {
        id: 2,
        title: "Minimal Recipe".to_string(),
        servings: None,
        total_time: None,
        tags: vec![],
        favorite: false,
        ingredients: vec![],
        steps: vec![],
        notes: vec![],
        source: RecipeSource {
            source_type: "manual".to_string(),
            host: None,
            url: None,
            method: None,
        },
        created_at: Utc::now(),
    };

    let json = serde_json::to_string(&r).unwrap();
    let val: serde_json::Value = serde_json::from_str(&json).unwrap();

    assert!(val["servings"].is_null());
    assert!(val["total_time"].is_null());
    assert_eq!(val["source"]["type"], "manual");
    assert!(val["source"]["host"].is_null());
}

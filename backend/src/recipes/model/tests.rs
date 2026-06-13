use super::Recipe;

#[test]
fn recipe_serializes_id_and_name() {
    let r = Recipe { id: 1, name: "Spaghetti Carbonara".to_string() };
    let json = serde_json::to_string(&r).unwrap();
    let val: serde_json::Value = serde_json::from_str(&json).unwrap();
    assert_eq!(val["id"], 1);
    assert_eq!(val["name"], "Spaghetti Carbonara");
}

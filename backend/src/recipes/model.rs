use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct Recipe {
    pub id: i32,
    pub name: String,
}

#[cfg(test)]
mod tests;

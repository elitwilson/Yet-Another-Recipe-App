INSERT INTO recipes (name) VALUES
    ('Spaghetti Carbonara'),
    ('Chicken Tikka Masala'),
    ('Beef Tacos'),
    ('Margherita Pizza'),
    ('Caesar Salad')
ON CONFLICT (name) DO NOTHING;

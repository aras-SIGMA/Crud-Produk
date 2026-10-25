CREATE TABLE IF NOT EXISTS categories (
  id_categories INT AUTO_INCREMENT PRIMARY KEY,
  name_categories VARCHAR(225) NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  id_categories INT,
  CONSTRAINT fk_products_categories FOREIGN KEY (id_categories) REFERENCES categories(id_categories)
);

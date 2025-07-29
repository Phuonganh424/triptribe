-- Tạo database mới
CREATE DATABASE IF NOT EXISTS triptribe
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Sử dụng database
USE triptribe;

-- Tạo bảng users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  name VARCHAR(255),
  start_date DATE,
  end_date DATE,
  location VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
ALTER TABLE plans ADD COLUMN detail TEXT;

CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id INT,
  category VARCHAR(100),
  description TEXT,
  amount DECIMAL(10,2),
  payer_email VARCHAR(255),
  shared BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE TABLE checklist_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id INT,
  item_name VARCHAR(255),
  quantity INT DEFAULT 1,
  is_checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Nếu bạn đang gặp lỗi xác thực với user 'root':
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'payeu7749Federico###';
FLUSH PRIVILEGES;


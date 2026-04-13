-- VacationSplit Database Schema
CREATE DATABASE IF NOT EXISTS vacation_split;
USE vacation_split;

-- Trips
CREATE TABLE IF NOT EXISTS trips (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(10)  UNIQUE NOT NULL,
    name        VARCHAR(255) NOT NULL,
    destination VARCHAR(255),
    start_date  DATE,
    end_date    DATE,
    created_by  INT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES members(id) ON DELETE SET NULL
);

-- Members
CREATE TABLE IF NOT EXISTS members (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    trip_id     INT NOT NULL,
    name        VARCHAR(255) NOT NULL,
    token       VARCHAR(64) UNIQUE NOT NULL,
    color_index INT DEFAULT 0,
    joined_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    trip_id      INT NOT NULL,
    title        VARCHAR(255) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    paid_by      INT NOT NULL,
    added_by     INT NOT NULL,
    category_id  INT NOT NULL DEFAULT 5,
    split_type   ENUM('even', 'custom') DEFAULT 'even',
    note         TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id)  REFERENCES trips(id)   ON DELETE CASCADE,
    FOREIGN KEY (paid_by)  REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES members(id) ON DELETE CASCADE
);

-- Expense Splits
CREATE TABLE IF NOT EXISTS expense_splits (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    expense_id  INT NOT NULL,
    member_id   INT NOT NULL,
    amount_owed DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id)  REFERENCES members(id)  ON DELETE CASCADE
);

-- Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    trip_id     INT NOT NULL,
    member_id   INT NOT NULL,
    action      VARCHAR(50),
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id)   REFERENCES trips(id)   ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

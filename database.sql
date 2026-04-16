CREATE DATABASE IF NOT EXISTS medaclinic;
USE medaclinic;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role ENUM('admin','doctor','nurse','patient') DEFAULT 'patient',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USUARIOS DEMO (password real: 123456)
INSERT INTO users (username, password, email, role) VALUES
('admin', '123456', 'admin@medaclinic.com', 'admin'),
('doctor1', '123456', 'doctor@medaclinic.com', 'doctor'),
('paciente1', '123456', 'paciente@medaclinic.com', 'patient');
-- Create Database if not exists
CREATE DATABASE IF NOT EXISTS cinestream_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cinestream_db;

-- 1. Movies Table
CREATE TABLE IF NOT EXISTS movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(100) NOT NULL,
    release_year INT NOT NULL,
    rating DECIMAL(3,1) DEFAULT 8.0,
    duration VARCHAR(50) NOT NULL,
    quality VARCHAR(20) DEFAULT 'HD',
    poster_url TEXT NOT NULL,
    video_url TEXT NOT NULL,
    download_url TEXT,
    is_featured TINYINT(1) DEFAULT 0,
    views_count INT DEFAULT 0,
    download_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL
);

-- 3. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Categories
INSERT IGNORE INTO categories (id, name, slug) VALUES 
(1, 'Action', 'action'),
(2, 'Sci-Fi', 'sci-fi'),
(3, 'Drama', 'drama'),
(4, 'Adventure', 'adventure'),
(5, 'Animation', 'animation'),
(6, 'Comedy', 'comedy'),
(7, 'Horror', 'horror'),
(8, 'Thriller', 'thriller');

-- Insert Initial Featured Sample Movies
INSERT INTO movies (title, description, genre, release_year, rating, duration, quality, poster_url, video_url, download_url, is_featured, views_count, download_count) 
VALUES 
(
    'Cyber Odyssey 2099', 
    'In a dystopian neo-metropolis, a rogue netrunner unravels a conspiracy that threatens to rewrite human consciousness.', 
    'Sci-Fi', 
    2025, 
    9.2, 
    '2h 24m', 
    '4K Ultra', 
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop', 
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 
    1, 
    14200, 
    3890
),
(
    'Shadow Realm: The Rising', 
    'When ancient mystical relics resurface, an elite guardian team must defend humanity against demonic incursions.', 
    'Action', 
    2024, 
    8.7, 
    '1h 58m', 
    '1080p HD', 
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop', 
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 
    1, 
    9800, 
    2150
),
(
    'Echoes of Eternity', 
    'A deep space expedition team encounters a sentient temporal anomaly near the edge of the known universe.', 
    'Sci-Fi', 
    2024, 
    9.0, 
    '2h 40m', 
    '4K Ultra', 
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop', 
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 
    0, 
    7300, 
    1840
),
(
    'The Last Horizon', 
    'An inspiring true-life story of sea explorers navigating uncharted waters against impossible odds.', 
    'Adventure', 
    2023, 
    8.4, 
    '2h 10m', 
    '1080p HD', 
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop', 
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 
    0, 
    5200, 
    1290
),
(
    'Neon City Lights', 
    'A slick crime-thriller set in a high-tech city where secrets are currency and trust is deadly.', 
    'Thriller', 
    2025, 
    8.9, 
    '1h 49m', 
    '4K Ultra', 
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1000&auto=format&fit=crop', 
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 
    1, 
    11500, 
    4120
),
(
    'Starlight Quest', 
    'An animated whimsical journey across galaxies in search of a lost legendary star collector.', 
    'Animation', 
    2024, 
    8.6, 
    '1h 35m', 
    'HD', 
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop', 
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 
    0, 
    6400, 
    1670
);

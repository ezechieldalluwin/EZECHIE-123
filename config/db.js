const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// In-Memory / File Fallback Storage for plug-and-play operation if MySQL is offline
const fallbackDbFile = path.join(__dirname, '../database/fallback_store.json');

let pool = null;
let useFallback = false;

// Initial Fallback Movies Data
const initialMovies = [
  {
    id: 1,
    title: 'Cyber Odyssey 2099',
    description: 'In a dystopian neo-metropolis, a rogue netrunner unravels a conspiracy that threatens to rewrite human consciousness.',
    genre: 'Sci-Fi',
    release_year: 2025,
    rating: 9.2,
    duration: '2h 24m',
    quality: '4K Ultra',
    poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    download_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    is_featured: 1,
    views_count: 14200,
    download_count: 3890,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Shadow Realm: The Rising',
    description: 'When ancient mystical relics resurface, an elite guardian team must defend humanity against demonic incursions.',
    genre: 'Action',
    release_year: 2024,
    rating: 8.7,
    duration: '1h 58m',
    quality: '1080p HD',
    poster_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    download_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    is_featured: 1,
    views_count: 9800,
    download_count: 2150,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    title: 'Echoes of Eternity',
    description: 'A deep space expedition team encounters a sentient temporal anomaly near the edge of the known universe.',
    genre: 'Sci-Fi',
    release_year: 2024,
    rating: 9.0,
    duration: '2h 40m',
    quality: '4K Ultra',
    poster_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    download_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    is_featured: 0,
    views_count: 7300,
    download_count: 1840,
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    title: 'The Last Horizon',
    description: 'An inspiring true-life story of sea explorers navigating uncharted waters against impossible odds.',
    genre: 'Adventure',
    release_year: 2023,
    rating: 8.4,
    duration: '2h 10m',
    quality: '1080p HD',
    poster_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    download_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    is_featured: 0,
    views_count: 5200,
    download_count: 1290,
    created_at: new Date().toISOString()
  },
  {
    id: 5,
    title: 'Neon City Lights',
    description: 'A slick crime-thriller set in a high-tech city where secrets are currency and trust is deadly.',
    genre: 'Thriller',
    release_year: 2025,
    rating: 8.9,
    duration: '1h 49m',
    quality: '4K Ultra',
    poster_url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1000&auto=format&fit=crop',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    download_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    is_featured: 1,
    views_count: 11500,
    download_count: 4120,
    created_at: new Date().toISOString()
  },
  {
    id: 6,
    title: 'Starlight Quest',
    description: 'An animated whimsical journey across galaxies in search of a lost legendary star collector.',
    genre: 'Animation',
    release_year: 2024,
    rating: 8.6,
    duration: '1h 35m',
    quality: 'HD',
    poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    download_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    is_featured: 0,
    views_count: 6400,
    download_count: 1670,
    created_at: new Date().toISOString()
  }
];

function loadFallbackData() {
  if (!fs.existsSync(path.dirname(fallbackDbFile))) {
    fs.mkdirSync(path.dirname(fallbackDbFile), { recursive: true });
  }
  if (!fs.existsSync(fallbackDbFile)) {
    fs.writeFileSync(fallbackDbFile, JSON.stringify(initialMovies, null, 2));
    return initialMovies;
  }
  try {
    const raw = fs.readFileSync(fallbackDbFile, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return initialMovies;
  }
}

function saveFallbackData(data) {
  try {
    fs.writeFileSync(fallbackDbFile, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error saving fallback data:', e);
  }
}

async function initDB() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'cinestream_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 2000
    });

    const conn = await pool.getConnection();
    console.log('✅ Connected to MySQL Database:', process.env.DB_NAME);
    
    // Auto initialize schema if table doesn't exist
    await conn.query(`
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed initial data if empty
    const [rows] = await conn.query('SELECT COUNT(*) as count FROM movies');
    if (rows[0].count === 0) {
      for (const m of initialMovies) {
        await conn.query(
          `INSERT INTO movies (title, description, genre, release_year, rating, duration, quality, poster_url, video_url, download_url, is_featured, views_count, download_count)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [m.title, m.description, m.genre, m.release_year, m.rating, m.duration, m.quality, m.poster_url, m.video_url, m.download_url, m.is_featured, m.views_count, m.download_count]
        );
      }
      console.log('✅ Seeded initial movies into MySQL table');
    }

    conn.release();
  } catch (error) {
    console.warn('⚠️ MySQL Connection failed (or server offline). Switching to JSON Data Engine Mode.');
    console.warn('   Reason:', error.message);
    useFallback = true;
  }
}

// Database helper functions that abstract MySQL / Fallback storage
const db = {
  initDB,
  isFallback: () => useFallback,
  
  async queryAllMovies({ search, genre, sort }) {
    if (!useFallback && pool) {
      let sql = 'SELECT * FROM movies WHERE 1=1';
      const params = [];
      
      if (search) {
        sql += ' AND (title LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      if (genre && genre !== 'All') {
        sql += ' AND genre = ?';
        params.push(genre);
      }

      if (sort === 'rating') sql += ' ORDER BY rating DESC';
      else if (sort === 'year') sql += ' ORDER BY release_year DESC';
      else if (sort === 'views') sql += ' ORDER BY views_count DESC';
      else sql += ' ORDER BY id DESC';

      const [rows] = await pool.query(sql, params);
      return rows;
    } else {
      let list = loadFallbackData();
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(m => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
      }
      if (genre && genre !== 'All') {
        list = list.filter(m => m.genre.toLowerCase() === genre.toLowerCase());
      }
      if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
      else if (sort === 'year') list.sort((a, b) => b.release_year - a.release_year);
      else if (sort === 'views') list.sort((a, b) => b.views_count - a.views_count);
      else list.sort((a, b) => b.id - a.id);
      
      return list;
    }
  },

  async getMovieById(id) {
    const numId = Number(id);
    if (!useFallback && pool) {
      const [rows] = await pool.query('SELECT * FROM movies WHERE id = ?', [numId]);
      return rows[0] || null;
    } else {
      const list = loadFallbackData();
      return list.find(m => m.id === numId) || null;
    }
  },

  async addMovie(data) {
    if (!useFallback && pool) {
      const [result] = await pool.query(
        `INSERT INTO movies (title, description, genre, release_year, rating, duration, quality, poster_url, video_url, download_url, is_featured, views_count, download_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        [
          data.title,
          data.description || '',
          data.genre || 'Action',
          Number(data.release_year) || new Date().getFullYear(),
          Number(data.rating) || 8.0,
          data.duration || '2h 00m',
          data.quality || '1080p HD',
          data.poster_url || '',
          data.video_url || '',
          data.download_url || data.video_url || '',
          data.is_featured ? 1 : 0
        ]
      );
      return this.getMovieById(result.insertId);
    } else {
      const list = loadFallbackData();
      const newId = list.length > 0 ? Math.max(...list.map(m => m.id)) + 1 : 1;
      const newMovie = {
        id: newId,
        title: data.title,
        description: data.description || '',
        genre: data.genre || 'Action',
        release_year: Number(data.release_year) || new Date().getFullYear(),
        rating: Number(data.rating) || 8.0,
        duration: data.duration || '2h 00m',
        quality: data.quality || '1080p HD',
        poster_url: data.poster_url || '',
        video_url: data.video_url || '',
        download_url: data.download_url || data.video_url || '',
        is_featured: data.is_featured ? 1 : 0,
        views_count: 0,
        download_count: 0,
        created_at: new Date().toISOString()
      };
      list.unshift(newMovie);
      saveFallbackData(list);
      return newMovie;
    }
  },

  async updateMovie(id, data) {
    const numId = Number(id);
    if (!useFallback && pool) {
      await pool.query(
        `UPDATE movies SET title = ?, description = ?, genre = ?, release_year = ?, rating = ?, duration = ?, quality = ?, poster_url = ?, video_url = ?, download_url = ?, is_featured = ?
         WHERE id = ?`,
        [
          data.title,
          data.description,
          data.genre,
          Number(data.release_year),
          Number(data.rating),
          data.duration,
          data.quality,
          data.poster_url,
          data.video_url,
          data.download_url || data.video_url,
          data.is_featured ? 1 : 0,
          numId
        ]
      );
      return this.getMovieById(numId);
    } else {
      let list = loadFallbackData();
      const idx = list.findIndex(m => m.id === numId);
      if (idx === -1) return null;
      list[idx] = {
        ...list[idx],
        title: data.title || list[idx].title,
        description: data.description || list[idx].description,
        genre: data.genre || list[idx].genre,
        release_year: Number(data.release_year) || list[idx].release_year,
        rating: Number(data.rating) || list[idx].rating,
        duration: data.duration || list[idx].duration,
        quality: data.quality || list[idx].quality,
        poster_url: data.poster_url || list[idx].poster_url,
        video_url: data.video_url || list[idx].video_url,
        download_url: data.download_url || data.video_url || list[idx].download_url,
        is_featured: data.is_featured !== undefined ? (data.is_featured ? 1 : 0) : list[idx].is_featured
      };
      saveFallbackData(list);
      return list[idx];
    }
  },

  async deleteMovie(id) {
    const numId = Number(id);
    if (!useFallback && pool) {
      const [res] = await pool.query('DELETE FROM movies WHERE id = ?', [numId]);
      return res.affectedRows > 0;
    } else {
      let list = loadFallbackData();
      const initialLen = list.length;
      list = list.filter(m => m.id !== numId);
      saveFallbackData(list);
      return list.length < initialLen;
    }
  },

  async incrementViews(id) {
    const numId = Number(id);
    if (!useFallback && pool) {
      await pool.query('UPDATE movies SET views_count = views_count + 1 WHERE id = ?', [numId]);
    } else {
      const list = loadFallbackData();
      const item = list.find(m => m.id === numId);
      if (item) {
        item.views_count = (item.views_count || 0) + 1;
        saveFallbackData(list);
      }
    }
  },

  async incrementDownloads(id) {
    const numId = Number(id);
    if (!useFallback && pool) {
      await pool.query('UPDATE movies SET download_count = download_count + 1 WHERE id = ?', [numId]);
    } else {
      const list = loadFallbackData();
      const item = list.find(m => m.id === numId);
      if (item) {
        item.download_count = (item.download_count || 0) + 1;
        saveFallbackData(list);
      }
    }
  }
};

module.exports = db;

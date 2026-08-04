const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../config/db');
const { verifyAdminToken } = require('../middleware/auth');

// Configure Multer for local poster/video uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage });

// 1. GET /api/movies - Public: Get all movies with search/genre/sort options
router.get('/', async(req, res) => {
    try {
        const { search, genre, sort } = req.query;
        const movies = await db.queryAllMovies({ search, genre, sort });
        res.json({
            success: true,
            count: movies.length,
            isFallbackMode: db.isFallback(),
            data: movies
        });
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching movies' });
    }
});

// 2. GET /api/movies/:id - Public: Get single movie & increment view count
router.get('/:id', async(req, res) => {
    try {
        const movie = await db.getMovieById(req.params.id);
        if (!movie) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }
        // Increment view count in background
        db.incrementViews(movie.id).catch(err => console.error(err));

        res.json({ success: true, data: movie });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error retrieving movie details' });
    }
});

// 3. GET /api/movies/:id/stream - Public: HTML5 video streaming with Range header support
router.get('/:id/stream', async(req, res) => {
    try {
        const movie = await db.getMovieById(req.params.id);
        if (!movie || !movie.video_url) {
            return res.status(404).json({ success: false, message: 'Video stream not available' });
        }

        // If video_url is a local file upload path
        if (movie.video_url.startsWith('/uploads/')) {
            const localFilePath = path.join(__dirname, '../public', movie.video_url);
            if (!fs.existsSync(localFilePath)) {
                return res.status(404).json({ success: false, message: 'Local video file not found' });
            }

            const stat = fs.statSync(localFilePath);
            const fileSize = stat.size;
            const range = req.headers.range;

            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

                const chunksize = (end - start) + 1;
                const file = fs.createReadStream(localFilePath, { start, end });
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'video/mp4',
                };

                res.writeHead(206, head);
                file.pipe(res);
            } else {
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': 'video/mp4',
                };
                res.writeHead(200, head);
                fs.createReadStream(localFilePath).pipe(res);
            }
        } else {
            // External video URL: redirect to high speed streaming mirror
            return res.redirect(movie.video_url);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Streaming error occurred' });
    }
});

// 4. GET /api/movies/:id/download - Public: Download movie to local machine
router.get('/:id/download', async(req, res) => {
    try {
        const movie = await db.getMovieById(req.params.id);
        if (!movie) {
            return res.status(404).send('Movie file not found');
        }

        // Increment download counter
        await db.incrementDownloads(movie.id);

        const downloadTarget = movie.download_url || movie.video_url;

        if (downloadTarget.startsWith('/uploads/')) {
            const localPath = path.join(__dirname, '../public', downloadTarget);
            if (fs.existsSync(localPath)) {
                const filename = `${movie.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`;
                return res.download(localPath, filename);
            }
        }

        // If external link, force download header or redirect
        res.setHeader('Content-Disposition', `attachment; filename="${movie.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4"`);
        res.redirect(downloadTarget);
    } catch (error) {
        res.status(500).send('Error initiating download');
    }
});

// 5. POST /api/movies - Admin Protected: Create new film
router.post(
    '/',
    verifyAdminToken,
    upload.fields([
        { name: 'poster_file', maxCount: 1 },
        { name: 'video_file', maxCount: 1 }
    ]),
    async(req, res) => {
        try {
            const { title, description, genre, release_year, rating, duration, quality, poster_url, video_url, is_featured } = req.body;

            if (!title || !genre) {
                return res.status(400).json({ success: false, message: 'Title and genre are required.' });
            }

            let finalPosterUrl = poster_url || '';
            let finalVideoUrl = video_url || '';

            if (req.files && req.files['poster_file']) {
                finalPosterUrl = '/uploads/' + req.files['poster_file'][0].filename;
            }
            if (req.files && req.files['video_file']) {
                finalVideoUrl = '/uploads/' + req.files['video_file'][0].filename;
            }

            // Default high quality fallback images if none specified
            if (!finalPosterUrl) {
                finalPosterUrl = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop';
            }
            if (!finalVideoUrl) {
                finalVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
            }

            const newMovie = await db.addMovie({
                title,
                description,
                genre,
                release_year: Number(release_year) || 2025,
                rating: Number(rating) || 8.5,
                duration: duration || '2h 00m',
                quality: quality || '1080p HD',
                poster_url: finalPosterUrl,
                video_url: finalVideoUrl,
                download_url: finalVideoUrl,
                is_featured: is_featured === 'true' || is_featured === true || is_featured === '1'
            });

            res.status(201).json({
                success: true,
                message: 'Movie added successfully!',
                data: newMovie
            });
        } catch (error) {
            console.error('Error adding movie:', error);
            res.status(500).json({ success: false, message: 'Failed to add movie to database' });
        }
    }
);

// 6. PUT /api/movies/:id - Admin Protected: Edit movie
router.put('/:id', verifyAdminToken, async(req, res) => {
    try {
        const updated = await db.updateMovie(req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }
        res.json({ success: true, message: 'Movie updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update movie' });
    }
});

// 7. DELETE /api/movies/:id - Admin Protected: Delete movie
router.delete('/:id', verifyAdminToken, async(req, res) => {
    try {
        const success = await db.deleteMovie(req.params.id);
        if (!success) {
            return res.status(404).json({ success: false, message: 'Movie not found or already deleted' });
        }
        res.json({ success: true, message: 'Movie deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete movie' });
    }
});

module.exports = router;
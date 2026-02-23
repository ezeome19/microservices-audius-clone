const express = require('express');
const songRoutes = require('../routes/songs');
const albumRoutes = require('../routes/albums');
const artistRoutes = require('../routes/artists');
const playlistRoutes = require('../routes/playlists');
const searchRoutes = require('../routes/search');
const userPlaylists = require('../routes/userPlaylists');
const { errorMiddleware } = require('../../../../shared');

module.exports = function (app) {
    app.use(express.json());

    // Health check
    app.get('/health', (req, res) => res.json({ status: 'ok', service: 'music' }));

    // Create a router for /api/music scope
    const apiRouter = express.Router();

    // User playlists (user-created playlists with Audius tracks)
    apiRouter.use('/user-playlists', userPlaylists);

    // Routes
    apiRouter.use('/songs', songRoutes);
    apiRouter.use('/albums', albumRoutes);
    apiRouter.use('/artists', artistRoutes);
    apiRouter.use('/playlists', playlistRoutes);
    apiRouter.use('/search', searchRoutes);
    apiRouter.use('/access', require('../routes/access')); // Content access control

    // Mount the API router
    // When proxied via Gateway, the /api/music prefix is stripped
    app.use('/', apiRouter);

    // Error handling middleware
    app.use(errorMiddleware);
};

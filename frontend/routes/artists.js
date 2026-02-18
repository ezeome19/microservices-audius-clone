const axios = require('axios');
const path = require('path');
// Import shared logger - adjust path to reach root shared folder
const logger = require('../../shared').logger || require('winston').createLogger({ transports: [new (require('winston').transports.Console)()] });

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://127.0.0.1:3000';

async function register(fastify, options) {
    // Artist preferences page (for new users)
    fastify.get('/preferences', async (request, reply) => {
        return reply.view('auth/artist-preferences', {
            title: 'Select Your Favorite Artists - Audius Clone'
        });
    });

    // Search artists (HTMX endpoint)
    fastify.get('/search', async (request, reply) => {
        try {
            const { query } = request.query;

            if (!query || query.trim().length === 0) {
                return reply.view('partials/artist-search-results', {
                    artists: [],
                    message: 'Start typing to search artists...'
                });
            }

            // Call music-catalog-service via API gateway
            const response = await axios.get(
                `${API_GATEWAY_URL}/api/music/artists/search`,
                {
                    params: {
                        query,
                        source: 'audius',
                        limit: 10
                    }
                }
            );

            return reply.view('partials/artist-search-results', {
                artists: response.data.artists || []
            });
        } catch (error) {
            logger.error(`Artist search error: ${error.message}`, {
                service: 'frontend',
                query
            });
            return reply.view('partials/artist-search-results', {
                artists: [],
                error: 'Failed to search artists'
            });
        }
    });

    // Import artist (HTMX endpoint)
    fastify.post('/import', async (request, reply) => {
        try {
            const { audiusId, name, profileImageUrl } = request.body;
            const token = request.cookies.token;

            if (!token) {
                return reply.status(401).send('Unauthorized');
            }

            // Call music-catalog-service to import artist
            const response = await axios.post(
                `${API_GATEWAY_URL}/api/music/artists/import`,
                { audiusId },
                {
                    headers: {
                        'x-auth-token': token
                    }
                }
            );

            // Return artist card partial
            return reply.view('partials/selected-artist-card', {
                artist: {
                    id: response.data.artist.id,
                    name: name,
                    profileImageUrl: profileImageUrl
                }
            });
        } catch (error) {
            logger.error(`Artist import error: ${error.message}`, { service: 'frontend' });
            return reply.status(500).send('Failed to import artist');
        }
    });

    // Save artist preferences
    fastify.post('/save-preferences', async (request, reply) => {
        try {
            const { preferredArtists } = request.body;
            const token = request.cookies.token;

            if (!token) {
                return reply.code(401).send({ message: 'Unauthorized' });
            }

            if (!preferredArtists || !Array.isArray(preferredArtists) || preferredArtists.length !== 3) {
                return reply.code(400).send({ message: 'Please select exactly 3 artists' });
            }

            // Call auth-service to update user preferences
            await axios.put(
                `${API_GATEWAY_URL}/api/auth/preferences`,
                { preferredArtists },
                {
                    headers: {
                        'x-auth-token': token
                    }
                }
            );

            return reply.send({ message: 'Preferences saved successfully' });
        } catch (error) {
            logger.error(`Save preferences error: ${error.message}`, { service: 'frontend' });
            return reply.code(500).send({ message: 'Failed to save preferences' });
        }
    });
}

module.exports = register;

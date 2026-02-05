// Set NODE_ENV to test BEFORE loading any modules
process.env.NODE_ENV = 'test';
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

// Mock backend services for testing
const express = require('express');

// Create mock auth service
const mockAuthService = express();
mockAuthService.use(express.json());

mockAuthService.post('/api/auth/users/signup', (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    if (email === 'existing@example.com') {
        return res.status(400).json({ message: 'User already registered' });
    }

    res.status(200).json({
        message: 'User registered successfully',
        user: { email, name, userType: 'consumer' },
        token: 'mock-jwt-token'
    });
});

mockAuthService.post('/api/auth/users/login', (req, res) => {
    const { email, password } = req.body;

    if (email === 'test@example.com' && password === 'password123') {
        return res.status(200).json({ token: 'mock-jwt-token' });
    }

    res.status(400).json({ message: 'Invalid email or password' });
});

// Create mock music catalog service
const mockMusicService = express();
mockMusicService.use(express.json());

mockMusicService.get('/api/music/artists/search', (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'Query parameter required' });
    }

    res.status(200).json({
        artists: [
            { id: '1', name: 'Test Artist', audiusId: 'test123' }
        ]
    });
});

let mockAuthServer;
let mockMusicServer;

// Start mock services before all tests
beforeAll(async () => {
    // Start mock auth service on port 3001
    mockAuthServer = mockAuthService.listen(3001);
    console.log('Mock auth service started on port 3001');

    // Start mock music service on port 3002
    mockMusicServer = mockMusicService.listen(3002);
    console.log('Mock music service started on port 3002');

    // Wait a bit for servers to start
    await new Promise(resolve => setTimeout(resolve, 500));
});

// Stop mock services after all tests
afterAll(async () => {
    if (mockAuthServer) {
        await new Promise(resolve => mockAuthServer.close(resolve));
        console.log('Mock auth service stopped');
    }

    if (mockMusicServer) {
        await new Promise(resolve => mockMusicServer.close(resolve));
        console.log('Mock music service stopped');
    }
});

module.exports = {
    mockAuthService,
    mockMusicService
};

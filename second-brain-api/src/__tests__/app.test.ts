import request from 'supertest';
import express from 'express';

// Create a mock Express app for testing
const app = express();

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Add an API root endpoint
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Second Brain API' });
});

describe('API Endpoints', () => {
  
  describe('Health Check', () => {
    it('should return 200 OK for health check endpoint', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('API Root', () => {
    it('should return welcome message for API root', async () => {
      const response = await request(app).get('/api');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Welcome');
    });
  });

  // More tests can be added here as the API grows
}); 
import express from 'express';

const router = express.Router();

// Define routes
router.get('/', (req: express.Request, res: express.Response) => {
  res.status(200).json({ message: 'Welcome to the Second Brain API' });
});

// Add more routes here as the API grows

export default router; 
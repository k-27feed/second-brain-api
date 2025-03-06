import express from 'express';
import authRoutes from './auth.routes';

const router = express.Router();

// Define base routes
router.get('/', (req: express.Request, res: express.Response) => {
  res.status(200).json({ message: 'Welcome to the Second Brain API' });
});

// Register routes
router.use('/auth', authRoutes);

// Add more routes here as the API grows

export default router; 
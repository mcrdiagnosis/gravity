import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import recordingRoutes from './routes/recordings';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/recordings', recordingRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', engine: 'Node.js Express', database: 'Prisma/SQLite' });
});

export default app;

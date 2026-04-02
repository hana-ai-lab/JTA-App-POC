import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __rootdir = dirname(dirname(fileURLToPath(import.meta.url)));
dotenv.config({ path: join(__rootdir, '.env') });

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import quizRoutes from './routes/quiz.js';
import chapterRoutes from './routes/chapters.js';
import diagnosisRoutes from './routes/diagnosis.js';
import progressRoutes from './routes/progress.js';
import userRoutes from './routes/user.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;

import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __rootdir = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
dotenv.config({ path: join(__rootdir, '.env') });

const express = (await import('express')).default;
const cors = (await import('cors')).default;
const { default: authRoutes } = await import('./routes/auth.js');
const { default: quizRoutes } = await import('./routes/quiz.js');
const { default: chapterRoutes } = await import('./routes/chapters.js');
const { default: diagnosisRoutes } = await import('./routes/diagnosis.js');
const { default: progressRoutes } = await import('./routes/progress.js');
const { default: userRoutes } = await import('./routes/user.js');

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

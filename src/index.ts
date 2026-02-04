import dotenv from 'dotenv';
import path from 'path';

// Load .env from root of backend-node
dotenv.config({ path: path.join(__dirname, '../.env') });

import app from './app';

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`🚀 Gravity Backend (Node.js) running on http://localhost:${PORT}`);
});

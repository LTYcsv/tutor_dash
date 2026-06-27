require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./middleware/auth').authenticate);

app.use('/api/students', require('./routes/students'));

// Routes uncommented task-by-task:
// app.use('/api/dashboard', require('./routes/dashboard'));
// app.use('/api/students', require('./routes/students'));
// app.use('/api/sessions', require('./routes/sessions'));
// app.use('/api/finance', require('./routes/finance'));
// app.use('/api/payments', require('./routes/payments'));
// app.use('/api/homework', require('./routes/homework'));
// app.use('/api/topics', require('./routes/topics'));
// app.use('/api/notes', require('./routes/notes'));
// app.use('/api/settings', require('./routes/settings'));

app.use(errorHandler);

module.exports = app;

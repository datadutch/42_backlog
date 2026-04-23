const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data', 'kanban-state.json');

// Ensure the data directory exists
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// Initialize the data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  const initialData = {
    tasks: {
      'task-1': { id: 'task-1', title: 'First task', description: 'Description for the first task' },
      'task-2': { id: 'task-2', title: 'Second task', description: 'Description for the second task' },
    },
    columns: {
      'column-1': { id: 'column-1', title: 'Backlog', taskIds: ['task-1', 'task-2'] },
      'column-2': { id: 'column-2', title: 'In Progress', taskIds: [] },
      'column-3': { id: 'column-3', title: 'Finished', taskIds: [] },
    },
    columnOrder: ['column-1', 'column-2', 'column-3'],
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

app.use(cors());
app.use(bodyParser.json());

// Get the current state
app.get('/api/state', (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  res.json(data);
});

// Save the state
app.post('/api/state', (req, res) => {
  const newState = req.body;
  fs.writeFileSync(DATA_FILE, JSON.stringify(newState, null, 2));
  res.json({ success: true });
});

app.listen(PORT, '::', () => {
  console.log(`Server is running on port ${PORT}`);
});
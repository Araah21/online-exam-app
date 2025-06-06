const express = require('express');
const { createClient } = require('@libsql/client');

const app = express();
const port = process.env.PORT || 3000;

// --- DATABASE SETUP ---
// Securely connect to your Turso cloud database
const db = createClient({
    url: process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_DB_TOKEN,
});

// Function to create the table if it doesn't exist
async function setupTable() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_name TEXT,
                student_id TEXT,
                score TEXT,
                answers TEXT,
                submitted_at TEXT
            )
        `);
        console.log("Results table is ready.");
    } catch (e) {
        console.error("Failed to set up database table:", e);
    }
}
// Run the setup function
setupTable();


// --- MIDDLEWARE ---
app.use(express.static(__dirname));
app.use(express.json());


// --- ROUTES ---

// Redirect root URL to the exam page
app.get('/', (req, res) => {
    res.redirect('/exam.html');
});

// API Endpoint to receive exam results
app.post('/api/submit-exam', async (req, res) => {
    const { name, id, score, answers, submittedAt } = req.body;
    const answersJson = JSON.stringify(answers);

    try {
        await db.execute({
            sql: "INSERT INTO results (student_name, student_id, score, answers, submitted_at) VALUES (?, ?, ?, ?, ?)",
            args: [name, id, score, answersJson, submittedAt]
        });
        console.log(`A new result has been added for student: ${name}`);
        res.status(200).json({ success: true, message: 'Results submitted successfully!' });
    } catch (e) {
        console.error("Database error:", e);
        res.status(500).json({ success: false, message: 'Failed to save results.' });
    }
});

// A simple page for the instructor to view all results
app.get('/results', async (req, res) => {
    try {
        const dbResult = await db.execute("SELECT * FROM results ORDER BY submitted_at DESC");
        const rows = dbResult.rows;

        let html = `
            <style>
                body { font-family: sans-serif; padding: 20px; } table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }
                tr:nth-child(even) { background-color: #f9f9f9; } h1 { text-align: center; }
            </style>
            <h1>Exam Submissions</h1>
            <table>
                <tr><th>Submission Time</th><th>Student Name</th><th>Student ID</th><th>Score</th><th>Answers</th></tr>`;

        if (rows.length > 0) {
            rows.forEach((row) => {
                html += `<tr><td>${row.submitted_at}</td><td>${row.student_name}</td><td>${row.student_id}</td><td>${row.score}</td><td>${row.answers}</td></tr>`;
            });
        }

        html += '</table>';
        res.send(html);
    } catch (e) {
        console.error("Error retrieving results:", e);
        res.status(500).send("Error retrieving results from database.");
    }
});


// --- START SERVER ---
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
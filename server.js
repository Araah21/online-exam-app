const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// --- DATABASE SETUP ---
const db = new sqlite3.Database('/var/data/exam_results.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        console.log("Database connected successfully.");
        db.run(`CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT,
            student_id TEXT,
            score TEXT,
            answers TEXT,
            submitted_at TEXT
        )`, (err) => {
            if (err) {
                console.error("Error creating table " + err.message);
            } else {
                console.log("Results table is ready.");
            }
        });
    }
});

// --- MIDDLEWARE ---
app.use(express.static(__dirname));
app.use(express.json());

// --- ROUTES ---

// API to receive results
app.post('/api/submit-exam', (req, res) => {
    const { name, id, score, answers, submittedAt } = req.body;
    const answersJson = JSON.stringify(answers);
    const sql = `INSERT INTO results (student_name, student_id, score, answers, submitted_at) VALUES (?, ?, ?, ?, ?)`;

    db.run(sql, [name, id, score, answersJson, submittedAt], function(err) {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).json({ success: false, message: 'Failed to save results.' });
        }
        console.log(`A new result has been added with ID: ${this.lastID}`);
        res.status(200).json({ success: true, message: 'Results submitted successfully!' });
    });
});

// Results viewer for instructor
app.get('/results', (req, res) => {
    const sql = "SELECT * FROM results ORDER BY submitted_at DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).send("Error retrieving results from database.");
            return console.error(err.message);
        }

        let html = `
            <style>
                body { font-family: sans-serif; padding: 20px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                h1 { text-align: center; }
            </style>
            <h1>Exam Submissions</h1>
            <table>
                <tr>
                    <th>Submission Time</th>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Score</th>
                    <th>Answers</th>
                </tr>`;

        rows.forEach((row) => {
            html += `
                <tr>
                    <td>${row.submitted_at}</td>
                    <td>${row.student_name}</td>
                    <td>${row.student_id}</td>
                    <td>${row.score}</td>
                    <td><pre>${row.answers}</pre></td>
                </tr>`;
        });

        html += '</table>';
        res.send(html);
    });
});

// --- START SERVER ---
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Students should go to http://localhost:${port}/exam.html`);
    console.log(`Instructor can view results at http://localhost:${port}/results`);
});

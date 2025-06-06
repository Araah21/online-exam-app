app.get('/results', async (req, res) => {
    try {
        const dbResult = await db.execute("SELECT * FROM results ORDER BY submitted_at DESC");
        const rows = dbResult.rows;

        let html = `
            <style>
                body { font-family: sans-serif; padding: 20px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                h1 { text-align: center; }
                pre { white-space: pre-wrap; word-wrap: break-word; }
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
    } catch (e) {
        console.error("Error retrieving results:", e);
        res.status(500).send("Error retrieving results from database.");
    }
});

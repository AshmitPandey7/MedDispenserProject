const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const MED_FILE = './medications.json';
const USER_FILE = './users.json';

// Helper functions
const getData = (file) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
const saveData = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// Auth Logic
app.post('/auth', (req, res) => {
    const { username, password, type } = req.body;
    let users = getData(USER_FILE);
    
    if (type === 'register') {
        if(users.find(u => u.username === username)) return res.status(400).send({status: "User Exists"});
        users.push({ username, password });
        saveData(USER_FILE, users);
        return res.send({ status: "Registered" });
    } else {
        const user = users.find(u => u.username === username && u.password === password);
        return user ? res.send({ status: "Success" }) : res.status(401).send({ status: "Fail" });
    }
});

// Medication Logic
app.get('/data', (req, res) => res.json(getData(MED_FILE)));
app.post('/save', (req, res) => {
    let meds = getData(MED_FILE);
    meds.push(req.body);
    saveData(MED_FILE, meds);
    res.send({ status: "Success" });
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
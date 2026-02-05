const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const MED_FILE = './medications.json';
const USER_FILE = './users.json';

const getData = (file) => {
    if (!fs.existsSync(file)) return [];
    try { return JSON.parse(fs.readFileSync(file)); } catch (e) { return []; }
};
const saveData = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// --- AUTH ---
app.post('/auth', (req, res) => {
    const { username, password, type, role } = req.body; // Added role
    let users = getData(USER_FILE);
    
    if (type === 'register') {
        if(users.find(u => u.username === username)) return res.status(400).send({status: "User Exists"});
        // Save role (admin/user)
        users.push({ username, password, role: role || 'user' });
        saveData(USER_FILE, users);
        return res.send({ status: "Registered" });
    } else {
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            // Return role so frontend knows where to redirect
            return res.send({ status: "Success", role: user.role });
        }
        return res.status(401).send({ status: "Fail" });
    }
});

// --- ADMIN: GET ALL USERS ---
app.get('/users', (req, res) => {
    const users = getData(USER_FILE);
    // Return only usernames and roles (hide passwords)
    res.json(users.map(u => ({ username: u.username, role: u.role })));
});

// --- DATA HANDLING ---
// GET Data (Supports filtering by ?user=Name)
app.get('/data', (req, res) => {
    const allData = getData(MED_FILE);
    const userFilter = req.query.user;
    
    if (userFilter) {
        // Return only data for specific user
        res.json(allData.filter(d => d.username === userFilter));
    } else {
        // Return everything (Admin view)
        res.json(allData);
    }
});

app.post('/save', (req, res) => {
    let meds = getData(MED_FILE);
    const newMed = { 
        id: Date.now() + Math.floor(Math.random() * 1000), 
        status: 'pending', 
        ...req.body // Body now includes 'username'
    };
    meds.push(newMed);
    saveData(MED_FILE, meds);
    res.send({ status: "Success", id: newMed.id });
});

app.put('/update/:id', (req, res) => {
    let meds = getData(MED_FILE);
    const id = parseInt(req.params.id);
    const index = meds.findIndex(m => m.id === id);
    if (index !== -1) {
        meds[index] = { ...meds[index], ...req.body };
        saveData(MED_FILE, meds);
        res.send({ status: "Updated" });
    } else { res.status(404).send({ status: "Not Found" }); }
});

app.patch('/status/:id', (req, res) => {
    let meds = getData(MED_FILE);
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const index = meds.findIndex(m => m.id === id);
    if (index !== -1) {
        meds[index].status = status;
        saveData(MED_FILE, meds);
        res.send({ status: "Status Updated" });
    } else { res.status(404).send({ status: "Not Found" }); }
});

app.delete('/delete/:id', (req, res) => {
    let meds = getData(MED_FILE);
    const id = parseInt(req.params.id);
    const newMeds = meds.filter(m => m.id !== id);
    saveData(MED_FILE, newMeds);
    res.send({ status: "Deleted" });
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
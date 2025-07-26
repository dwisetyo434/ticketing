const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'tickets.json');

// Middleware
app.use(cors()); // Mengizinkan permintaan dari domain lain (untuk frontend)
app.use(bodyParser.json()); // Mengurai body permintaan sebagai JSON

// Fungsi untuk membaca tiket dari file JSON
const readTickets = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Jika file tidak ada atau rusak, kembalikan array kosong
        if (error.code === 'ENOENT') {
            console.log('tickets.json not found, creating an empty one.');
            return [];
        }
        console.error('Error reading tickets.json:', error);
        return [];
    }
};

// Fungsi untuk menulis tiket ke file JSON
const writeTickets = (tickets) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tickets, null, 2), 'utf8');
};

// --- API Endpoints ---

// GET: Mendapatkan semua tiket
app.get('/api/tickets', (req, res) => {
    const tickets = readTickets();
    res.json(tickets);
});

// GET: Mendapatkan tiket berdasarkan ID
app.get('/api/tickets/:id', (req, res) => {
    const tickets = readTickets();
    const ticket = tickets.find(t => t.id === req.params.id);
    if (ticket) {
        res.json(ticket);
    } else {
        res.status(404).json({ message: 'Ticket not found' });
    }
});

// POST: Membuat tiket baru
app.post('/api/tickets', (req, res) => {
    const tickets = readTickets();
    const newTicket = {
        id: Date.now().toString(), // ID unik berbasis timestamp
        subject: req.body.subject,
        description: req.body.description,
        priority: req.body.priority || 'Medium',
        status: 'New', // Status awal
        agent: null, // Agen belum ditugaskan
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        comments: []
    };
    tickets.push(newTicket);
    writeTickets(tickets);
    res.status(201).json(newTicket);
});

// PUT: Memperbarui tiket (status, agen, dll.)
app.put('/api/tickets/:id', (req, res) => {
    const tickets = readTickets();
    const ticketIndex = tickets.findIndex(t => t.id === req.params.id);

    if (ticketIndex !== -1) {
        const updatedTicket = {
            ...tickets[ticketIndex],
            ...req.body, // Update properti yang diberikan dari body
            updatedAt: new Date().toISOString()
        };
        tickets[ticketIndex] = updatedTicket;
        writeTickets(tickets);
        res.json(updatedTicket);
    } else {
        res.status(404).json({ message: 'Ticket not found' });
    }
});

// POST: Menambahkan komentar ke tiket
app.post('/api/tickets/:id/comments', (req, res) => {
    const tickets = readTickets();
    const ticketIndex = tickets.findIndex(t => t.id === req.params.id);

    if (ticketIndex !== -1) {
        const newComment = {
            id: Date.now().toString(),
            text: req.body.text,
            author: req.body.author || 'User',
            createdAt: new Date().toISOString()
        };
        tickets[ticketIndex].comments.push(newComment);
        tickets[ticketIndex].updatedAt = new Date().toISOString();
        writeTickets(tickets);
        res.status(201).json(newComment);
    } else {
        res.status(404).json({ message: 'Ticket not found' });
    }
});

// DELETE: Menghapus tiket
app.delete('/api/tickets/:id', (req, res) => {
    let tickets = readTickets();
    const initialLength = tickets.length;
    tickets = tickets.filter(t => t.id !== req.params.id);
    if (tickets.length < initialLength) {
        writeTickets(tickets);
        res.status(204).send(); // No Content
    } else {
        res.status(404).json({ message: 'Ticket not found' });
    }
});


// Jalankan server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
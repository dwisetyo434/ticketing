const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
// const fs = require('fs'); // Hapus atau komen baris ini
// const path = require('path'); // Hapus atau komen baris ini

// Import Replit DB
const Database = require('@replit/database');
const db = new Database(); // Inisialisasi Replit DB

const app = express();
const PORT = 3000;
// const DATA_FILE = path.join(__dirname, 'tickets.json'); // Hapus atau komen baris ini
const DB_KEY = 'allTickets'; // Kunci untuk menyimpan semua tiket di Replit DB

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Fungsi untuk membaca tiket dari Replit DB
const readTickets = async () => {
    try {
        const tickets = await db.get(DB_KEY); // Ambil data dari Replit DB
        return tickets || []; // Jika belum ada, kembalikan array kosong
    } catch (error) {
        console.error('Error reading tickets from Replit DB:', error);
        return [];
    }
};

// Fungsi untuk menulis tiket ke Replit DB
const writeTickets = async (tickets) => {
    try {
        await db.set(DB_KEY, tickets); // Simpan data ke Replit DB
    } catch (error) {
        console.error('Error writing tickets to Replit DB:', error);
    }
};

// --- API Endpoints ---

// GET: Mendapatkan semua tiket
app.get('/api/tickets', async (req, res) => {
    const tickets = await readTickets();
    res.json(tickets);
});

// GET: Mendapatkan tiket berdasarkan ID
app.get('/api/tickets/:id', async (req, res) => {
    const tickets = await readTickets();
    const ticket = tickets.find(t => t.id === req.params.id);
    if (ticket) {
        res.json(ticket);
    } else {
        res.status(404).json({ message: 'Ticket not found' });
    }
});

// POST: Membuat tiket baru
app.post('/api/tickets', async (req, res) => {
    const tickets = await readTickets();
    const newTicket = {
        id: Date.now().toString(),
        subject: req.body.subject,
        description: req.body.description,
        priority: req.body.priority || 'Medium',
        status: 'New',
        agent: req.body.agent || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        comments: []
    };
    tickets.push(newTicket);
    await writeTickets(tickets); // Gunakan await
    res.status(201).json(newTicket);
});

// PUT: Memperbarui tiket (status, agen, dll.)
app.put('/api/tickets/:id', async (req, res) => {
    const tickets = await readTickets();
    const ticketIndex = tickets.findIndex(t => t.id === req.params.id);

    if (ticketIndex !== -1) {
        const updatedTicket = {
            ...tickets[ticketIndex],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        tickets[ticketIndex] = updatedTicket;
        await writeTickets(tickets); // Gunakan await
        res.json(updatedTicket);
    } else {
        res.status(404).json({ message: 'Ticket not found' });
    }
});

// POST: Menambahkan komentar ke tiket
app.post('/api/tickets/:id/comments', async (req, res) => {
    const tickets = await readTickets();
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
        await writeTickets(tickets); // Gunakan await
        res.status(201).json(newComment);
    } else {
        res.status(404).json({ message: 'Ticket not found' });
    }
});

// DELETE: Menghapus tiket
app.delete('/api/tickets/:id', async (req, res) => {
    let tickets = await readTickets();
    const initialLength = tickets.length;
    tickets = tickets.filter(t => t.id !== req.params.id);
    if (tickets.length < initialLength) {
        await writeTickets(tickets); // Gunakan await
        res.status(204).send();
    } else {
        res.status(404).json({ message: 'Ticket not found' });
    }
});

// NEW API Endpoint: Export Tickets to CSV
app.get('/api/tickets/export/csv', async (req, res) => {
    const tickets = await readTickets(); // Baca dari Replit DB

    if (tickets.length === 0) {
        return res.status(204).send();
    }

    const headers = ["ID", "Subjek", "Deskripsi", "Prioritas", "Status", "Agen", "Dibuat Pada", "Terakhir Diupdate", "Jumlah Komentar"];

    const csvRows = tickets.map(ticket => {
        const description = `"${ticket.description.replace(/"/g, '""')}"`;
        const commentCount = ticket.comments ? ticket.comments.length : 0;
        return [
            ticket.id,
            `"${ticket.subject.replace(/"/g, '""')}"`,
            description,
            ticket.priority,
            ticket.status,
            `"${ticket.agent || 'Belum Ditugaskan'}"`,
            ticket.createdAt,
            ticket.updatedAt,
            commentCount
        ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tickets_export.csv"');
    res.send(csvContent);
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
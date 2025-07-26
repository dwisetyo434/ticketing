const API_BASE_URL = 'http://localhost:3000/api/tickets'; // URL API backend

// --- Element References ---
const ticketForm = document.getElementById('ticketForm');
const subjectInput = document.getElementById('subject');
const descriptionInput = document.getElementById('description');
const priorityInput = document.getElementById('priority');
const ticketListDiv = document.getElementById('ticketList');
const filterStatusSelect = document.getElementById('filterStatus');
const filterPrioritySelect = document.getElementById('filterPriority');

// Modal Elements
const ticketDetailModal = document.getElementById('ticketDetailModal');
const modalTicketSubject = document.getElementById('modalTicketSubject');
const modalTicketId = document.getElementById('modalTicketId');
const modalTicketDescription = document.getElementById('modalTicketDescription');
const modalTicketPriority = document.getElementById('modalTicketPriority');
const modalTicketStatus = document.getElementById('modalTicketStatus');
const modalTicketAgent = document.getElementById('modalTicketAgent');
const modalTicketCreatedAt = document.getElementById('modalTicketCreatedAt');
const modalTicketUpdatedAt = document.getElementById('modalTicketUpdatedAt');
const updateStatusSelect = document.getElementById('updateStatus');
const updateAgentInput = document.getElementById('updateAgent');
const saveTicketChangesButton = document.getElementById('saveTicketChanges');
const deleteTicketButton = document.getElementById('deleteTicketButton');
const modalCommentsDiv = document.getElementById('modalComments');
const newCommentTextarea = document.getElementById('newCommentText');
const newCommentAuthorInput = document.getElementById('newCommentAuthor');
const addCommentButton = document.getElementById('addCommentButton');
const closeModalButton = document.querySelector('#ticketDetailModal .close-button');

let currentTicketId = null; // Untuk melacak tiket yang sedang dilihat di modal

// --- Helper Functions ---

// Format tanggal
const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString(); // Contoh: "1/20/2024, 10:30:00 AM"
};

// Render tiket ke DOM
const renderTickets = (tickets) => {
    ticketListDiv.innerHTML = ''; // Kosongkan daftar tiket yang ada
    if (tickets.length === 0) {
        ticketListDiv.innerHTML = '<p>Tidak ada tiket ditemukan.</p>';
        return;
    }

    tickets.forEach(ticket => {
        const ticketItem = document.createElement('div');
        ticketItem.classList.add('ticket-item');
        ticketItem.setAttribute('data-id', ticket.id); // Simpan ID di elemen HTML

        // Menentukan warna badge status
        let statusClass = '';
        if (ticket.status === 'New') statusClass = 'status-New';
        else if (ticket.status === 'In Progress') statusClass = 'status-In';
        else if (ticket.status === 'Resolved') statusClass = 'status-Resolved';
        else if (ticket.status === 'Closed') statusClass = 'status-Closed';

        // Menentukan warna prioritas
        let priorityClass = '';
        if (ticket.priority === 'High') priorityClass = 'priority-high';
        else if (ticket.priority === 'Medium') priorityClass = 'priority-medium';
        else if (ticket.priority === 'Low') priorityClass = 'priority-low';


        ticketItem.innerHTML = `
            <span class="status-badge ${statusClass}">${ticket.status}</span>
            <h3>${ticket.subject}</h3>
            <p><strong>ID:</strong> ${ticket.id}</p>
            <p><strong>Prioritas:</strong> <span class="${priorityClass}">${ticket.priority}</span></p>
            <p><strong>Agen:</strong> ${ticket.agent || 'Belum Ditugaskan'}</p>
            <p><strong>Dibuat:</strong> ${formatDate(ticket.createdAt)}</p>
        `;
        ticketItem.addEventListener('click', () => showTicketDetail(ticket.id));
        ticketListDiv.appendChild(ticketItem);
    });
};

// Filter dan tampilkan tiket
const filterAndRenderTickets = async () => {
    const status = filterStatusSelect.value;
    const priority = filterPrioritySelect.value;

    try {
        const response = await fetch(API_BASE_URL);
        const allTickets = await response.json();

        const filteredTickets = allTickets.filter(ticket => {
            const matchesStatus = status === 'All' || ticket.status === status;
            const matchesPriority = priority === 'All' || ticket.priority === priority;
            return matchesStatus && matchesPriority;
        });
        renderTickets(filteredTickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        ticketListDiv.innerHTML = '<p style="color: red;">Gagal memuat tiket. Pastikan server backend berjalan!</p>';
    }
};

// --- Event Handlers ---

// Submit form tiket baru
ticketForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Mencegah refresh halaman
    const newTicket = {
        subject: subjectInput.value,
        description: descriptionInput.value,
        priority: priorityInput.value
    };

    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTicket)
        });
        if (response.ok) {
            alert('Tiket berhasil diajukan!');
            ticketForm.reset(); // Reset form
            filterAndRenderTickets(); // Muat ulang daftar tiket
        } else {
            alert('Gagal mengajukan tiket.');
        }
    } catch (error) {
        console.error('Error submitting ticket:', error);
        alert('Terjadi kesalahan saat mengajukan tiket. Pastikan server berjalan.');
    }
});

// Tampilkan detail tiket di modal
const showTicketDetail = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        const ticket = await response.json();

        if (ticket) {
            currentTicketId = ticket.id; // Simpan ID tiket yang sedang aktif
            modalTicketSubject.textContent = ticket.subject;
            modalTicketId.textContent = ticket.id;
            modalTicketDescription.textContent = ticket.description;
            modalTicketPriority.textContent = ticket.priority;
            modalTicketStatus.textContent = ticket.status;
            modalTicketAgent.textContent = ticket.agent || 'Belum Ditugaskan';
            modalTicketCreatedAt.textContent = formatDate(ticket.createdAt);
            modalTicketUpdatedAt.textContent = formatDate(ticket.updatedAt);

            // Set nilai di form update
            updateStatusSelect.value = ticket.status;
            updateAgentInput.value = ticket.agent || '';

            // Render komentar
            modalCommentsDiv.innerHTML = '';
            if (ticket.comments && ticket.comments.length > 0) {
                ticket.comments.forEach(comment => {
                    const commentItem = document.createElement('div');
                    commentItem.classList.add('comment-item');
                    commentItem.innerHTML = `
                        <p><strong>${comment.author || 'Anonim'}:</strong> ${comment.text}</p>
                        <span class="comment-date">${formatDate(comment.createdAt)}</span>
                    `;
                    modalCommentsDiv.appendChild(commentItem);
                });
            } else {
                modalCommentsDiv.innerHTML = '<p>Belum ada komentar.</p>';
            }

            // Reset form komentar
            newCommentTextarea.value = '';
            newCommentAuthorInput.value = 'Agen'; // Default author

            ticketDetailModal.classList.add('show'); // Tampilkan modal
        }
    } catch (error) {
        console.error('Error fetching ticket details:', error);
        alert('Gagal memuat detail tiket.');
    }
};

// Simpan perubahan tiket dari modal
saveTicketChangesButton.addEventListener('click', async () => {
    if (!currentTicketId) return;

    const updatedData = {
        status: updateStatusSelect.value,
        agent: updateAgentInput.value.trim() || null // Kirim null jika kosong
    };

    try {
        const response = await fetch(`${API_BASE_URL}/${currentTicketId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });
        if (response.ok) {
            alert('Perubahan tiket berhasil disimpan!');
            ticketDetailModal.classList.remove('show'); // Tutup modal
            filterAndRenderTickets(); // Muat ulang daftar tiket
        } else {
            alert('Gagal menyimpan perubahan tiket.');
        }
    } catch (error) {
        console.error('Error saving ticket changes:', error);
        alert('Terjadi kesalahan saat menyimpan perubahan.');
    }
});

// Tambah komentar dari modal
addCommentButton.addEventListener('click', async () => {
    if (!currentTicketId) return;

    const commentText = newCommentTextarea.value.trim();
    const commentAuthor = newCommentAuthorInput.value.trim();

    if (!commentText) {
        alert('Komentar tidak boleh kosong.');
        return;
    }

    const newComment = {
        text: commentText,
        author: commentAuthor
    };

    try {
        const response = await fetch(`${API_BASE_URL}/${currentTicketId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newComment)
        });
        if (response.ok) {
            alert('Komentar berhasil ditambahkan!');
            newCommentTextarea.value = ''; // Kosongkan textarea
            // Muat ulang detail tiket untuk menampilkan komentar baru
            showTicketDetail(currentTicketId);
        } else {
            alert('Gagal menambahkan komentar.');
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        alert('Terjadi kesalahan saat menambahkan komentar.');
    }
});

// Hapus tiket
deleteTicketButton.addEventListener('click', async () => {
    if (!currentTicketId) return;

    if (confirm('Apakah Anda yakin ingin menghapus tiket ini? Tindakan ini tidak dapat dibatalkan.')) {
        try {
            const response = await fetch(`${API_BASE_URL}/${currentTicketId}`, {
                method: 'DELETE'
            });
            if (response.status === 204) { // 204 No Content for successful delete
                alert('Tiket berhasil dihapus!');
                ticketDetailModal.classList.remove('show'); // Tutup modal
                filterAndRenderTickets(); // Muat ulang daftar tiket
            } else if (response.status === 404) {
                alert('Tiket tidak ditemukan.');
            } else {
                alert('Gagal menghapus tiket.');
            }
        } catch (error) {
            console.error('Error deleting ticket:', error);
            alert('Terjadi kesalahan saat menghapus tiket.');
        }
    }
});

// Tutup modal
closeModalButton.addEventListener('click', () => {
    ticketDetailModal.classList.remove('show');
});

// Tutup modal jika klik di luar konten modal
window.addEventListener('click', (event) => {
    if (event.target == ticketDetailModal) {
        ticketDetailModal.classList.remove('show');
    }
});


// Event listener untuk filter
filterStatusSelect.addEventListener('change', filterAndRenderTickets);
filterPrioritySelect.addEventListener('change', filterAndRenderTickets);


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    filterAndRenderTickets(); // Muat semua tiket saat halaman pertama kali dimuat
});
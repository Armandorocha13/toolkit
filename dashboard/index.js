const fileContratados = document.getElementById('file_contratados');
const fileVolante = document.getElementById('file_volante');

const labelContratados = document.getElementById('label-contratados');
const labelVolante = document.getElementById('label-volante');

const uploadForm = document.getElementById('upload-form');
const syncBtn = document.getElementById('sync-btn');
const syncLogs = document.getElementById('sync-logs');
const exportBtn = document.getElementById('export-btn');
const exportStatus = document.getElementById('export-status');
const reportsList = document.getElementById('reports-list');
const serverStatus = document.getElementById('server-status');

const API_BASE = 'http://localhost:3000';

// Check server status
async function checkStatus() {
    try {
        const res = await fetch(`${API_BASE}/status`);
        if (res.ok) {
            serverStatus.classList.add('online');
            serverStatus.innerHTML = '<span class="indicator"></span> Servidor Online';
            return true;
        }
    } catch (e) {
        serverStatus.classList.remove('online');
        serverStatus.innerHTML = '<span class="indicator"></span> Servidor Offline';
    }
    return false;
}

setInterval(checkStatus, 3000);
checkStatus();

function checkEnableSync() {
    // Pode habilitar se pelo menos o Contratados e o Volante estiverem presentes
    if (fileContratados.files.length > 0 && fileVolante.files.length > 0) {
        syncBtn.disabled = false;
    } else {
        syncBtn.disabled = true;
    }
}

function setupFileInput(input, label) {
    input.addEventListener('change', () => {
        if (input.files.length > 0) {
            label.innerText = input.files[0].name;
            label.style.color = '#000';
        } else {
            label.innerText = 'Selecionar arquivo...';
            label.style.color = 'var(--text-muted)';
        }
        checkEnableSync();
    });
}

setupFileInput(fileContratados, labelContratados);
setupFileInput(fileVolante, labelVolante);

// Syncing
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    syncLogs.innerHTML = '<div class="log-item info">Iniciando sincronização...</div>';
    syncBtn.disabled = true;

    const month = document.getElementById('export-month').value;
    const formData = new FormData();
    
    if (fileContratados.files.length > 0) {
        formData.append('file_contratados', fileContratados.files[0]);
    }
    if (fileVolante.files.length > 0) {
        formData.append('file_volante', fileVolante.files[0]);
    }
    
    formData.append('month', month);

    try {
        const response = await fetch(`${API_BASE}/sync`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.logs) {
            data.logs.forEach(log => {
                const logItem = document.createElement('div');
                logItem.className = `log-item ${log.type}`;
                logItem.innerText = log.message;
                syncLogs.appendChild(logItem);
                syncLogs.scrollTop = syncLogs.scrollHeight;
            });
        }

        if (data.success) {
            fileContratados.value = '';
            fileVolante.value = '';
            labelContratados.innerText = 'Selecionar arquivo...';
            labelVolante.innerText = 'Selecionar arquivo...';
        }
    } catch (err) {
        const logItem = document.createElement('div');
        logItem.className = 'log-item error';
        logItem.innerText = 'Falha ao conectar com o servidor.';
        syncLogs.appendChild(logItem);
    } finally {
        checkEnableSync();
    }
});

// Exporting
exportBtn.addEventListener('click', async () => {
    exportBtn.disabled = true;
    exportStatus.innerHTML = '<div class="log-item info">Gerando relatório...</div>';
    
    const month = document.getElementById('export-month').value;

    try {
        const response = await fetch(`${API_BASE}/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month })
        });

        const data = await response.json();
        if (data.success) {
            exportStatus.innerHTML = `<div class="log-item success">Relatório gerado: ${data.filename}</div>`;
            updateReportsList(data.filename);
        } else {
            exportStatus.innerHTML = `<div class="log-item error">Erro: ${data.message}</div>`;
        }
    } catch (err) {
        exportStatus.innerHTML = '<div class="log-item error">Falha na conexão.</div>';
    } finally {
        exportBtn.disabled = false;
    }
});

function updateReportsList(filename) {
    if (reportsList.querySelector('.empty')) reportsList.innerHTML = '';
    const li = document.createElement('li');
    li.style.fontSize = '0.85rem';
    li.style.color = 'var(--success)';
    li.style.marginBottom = '0.5rem';
    li.innerHTML = `<i data-lucide="file-check"></i> ${filename}`;
    reportsList.prepend(li);
    lucide.createIcons();
}

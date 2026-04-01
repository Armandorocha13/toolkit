const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs-extra');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static(path.join(__dirname, 'dashboard')));

// Multer storage setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'dados'));
    },
    filename: (req, file, cb) => {
        // Salva arquivo com nome temporário para evitar que o navegador bloqueie o envio (ERR_UPLOAD_FILE_CHANGED) 
        // caso o usuário esteja selecionando o arquivo da própria pasta 'dados' e o servidor tente sobrescrevê-lo durante a leitura.
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.tmp');
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Status endpoint
app.get('/status', (req, res) => {
    res.json({ online: true });
});

// SYNC ENDPOINT (Upload + Import)
app.post('/sync', upload.fields([
    { name: 'file_contratados', maxCount: 1 },
    { name: 'file_volante', maxCount: 1 }
]), async (req, res) => {
    const { month } = req.body;
    console.log(`Recebida solicitação de sincronização para: ${month}`);
    const logs = [];

    // Renomeia os arquivos temporários para seus nomes oficiais seguros
    try {
        if (req.files['file_contratados']) {
            fs.moveSync(
                req.files['file_contratados'][0].path, 
                path.join(__dirname, 'dados', 'CONTRATADO 2026 GERAL FFA.xlsx'),
                { overwrite: true }
            );
        }
        if (req.files['file_volante']) {
            fs.moveSync(
                req.files['file_volante'][0].path, 
                path.join(__dirname, 'dados', 'saldoVolante.xlsx'),
                { overwrite: true }
            );
        }
    } catch (err) {
        console.error("Erro ao renomear arquivos:", err);
        return res.status(500).json({ success: false, logs: [{ type: 'error', message: `Erro ao processar as planilhas: ${err.message}` }] });
    }

    // Rodar os scripts de importação em sequência
    const scripts = [
        'node scripts/import/importSaldoVolante.js',
        `node scripts/import/importContratado2026.js "${month}"`
    ];

    try {
        for (const script of scripts) {
            console.log(`Executando: ${script}`);
            await new Promise((resolve, reject) => {
                exec(script, (error, stdout, stderr) => {
                    if (error) {
                        logs.push({ type: 'error', message: `Erro no script ${script}: ${error.message}` });
                        reject(error);
                    } else {
                        logs.push({ type: 'success', message: `${script} concluído com sucesso!` });
                        resolve();
                    }
                });
            });
        }

        res.json({ success: true, logs });
    } catch (err) {
        res.status(500).json({ success: false, logs });
    }
});

// EXPORT ENDPOINT
app.post('/export', async (req, res) => {
    const { month } = req.body;
    console.log(`Solicitação de exportação para: ${month}`);

    exec(`node scripts/export/exportFullReport.js "${month}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erro na exportação: ${error.message}`);
            return res.status(500).json({ success: false, message: error.message });
        }
        res.json({ success: true, filename: 'CONTROLE DE TOOLKIT.xlsx' });
    });
});

const server = app.listen(port, () => {
    console.log(`\n🚀 SERVIDOR DE AUDITORIA INICIADO EM http://localhost:${port}`);
    console.log(`✨ Interface acessível em: http://localhost:${port}/index.html`);
});

// Aumentar timeout para 10 minutos (importações grandes podem demorar)
server.timeout = 600000;

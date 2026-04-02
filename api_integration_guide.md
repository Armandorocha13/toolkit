# 📡 Documentação de Integração API - Controle Toolkit

Para vincular os botões do projeto **AXIS** (ou qualquer outro frontend) às automações deste sistema, utilize os endpoints abaixo.

**Base URL**: `http://localhost:3000`

---

## 1. Sincronia de Dados (Banco de Dados)
Este endpoint aguarda o envio das planilhas de RH e WMS para processar as importações no Supabase.

> [!TIP]
> **Upload Opcional:** Se você não enviar arquivos, o sistema usará automaticamente as planilhas que já estão na pasta `dados` do servidor. Isso permite que você tenha um botão de "Sincronia Rápida" no AXIS sem precisar pedir arquivos ao usuário todas as vezes.

*   **Endpoint**: `/sync`
*   **Método**: `POST`
*   **Corpo (FormData)**:
    *   `file_contratados`: (Opcional) Arquivo `.xlsx`
    *   `file_volante`: (Opcional) Arquivo `.xlsx`
    *   `month`: String (ex: `"03/2026"`)


**Exemplo de Chamada (JS):**
```javascript
const formData = new FormData();
formData.append('file_contratados', inputRH.files[0]);
formData.append('file_volante', inputWMS.files[0]);
formData.append('month', "04/2026");

fetch('http://localhost:3000/sync', {
    method: 'POST',
    body: formData
}).then(res => res.json()).then(console.log);
```

---

## 2. Extração de XLSX (Relatórios)
Aciona a geração do arquivo consolidado `CONTROLE DE TOOLKIT.xlsx`.

*   **Endpoint**: `/export`
*   **Método**: `POST`
*   **Corpo (JSON)**:
    *   `month`: String (ex: `"03/2026"`)

**Exemplo de Chamada (JS):**
```javascript
fetch('http://localhost:3000/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month: "04/2026" })
}).then(res => res.json()).then(data => {
    if (data.success) {
        // Redireciona para o download do arquivo gerado
        window.location.href = 'http://localhost:3000/download';
    }
});
```

---

## 3. Atualizar Power BI
Executa a consolidação final da base para que o Power BI possa refletir os novos dados.

*   **Endpoint**: `/pbi`
*   **Método**: `POST`

**Exemplo de Chamada (JS):**
```javascript
fetch('http://localhost:3000/pbi', {
    method: 'POST'
}).then(res => res.json()).then(data => alert(data.message));
```

---

## 🏗️ Status do Sistema
Você pode monitorar se o servidor de automação está online acessando:
`GET http://localhost:3000/status`

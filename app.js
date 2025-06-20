const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const port = 3000;

// Get root directory of the project
const rootDir = path.resolve(__dirname);

// Multer setup for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// --- Middleware ---
// Serve static files from the 'public' directory
app.use(express.static(path.join(rootDir, 'public')));
// Increase the limit for JSON payload
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON format in request body' });
    }
    next();
});

// --- Routes ---
// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(rootDir, 'public', 'index.html'));
});

app.post('/process', upload.single('jsonFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Tidak ada file yang di-upload' });
        }

        // Nama file output sama dengan nama file asli
        const outputFilename = req.file.originalname;
        const fileContent = req.file.buffer.toString('utf8');
        
        let jsonData;
        try {
            jsonData = JSON.parse(fileContent);
        } catch (parseError) {
            return res.status(400).json({ error: 'Format JSON pada file tidak valid: ' + parseError.message });
        }
        
        // Process the data
        const result = {};
        
        jsonData.forEach(item => {
            const city = item.city;
            if (!result[city]) {
                result[city] = [];
            }
            if (!result[city].includes(item.postal_code)) {
                result[city].push(item.postal_code);
            }
        });

        // Sort postal codes for each city at the very end
        Object.keys(result).forEach(city => {
            result[city].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        });

        // Buat folder output jika belum ada
        const outputDir = path.join(rootDir, 'output');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        const outputPath = path.join(outputDir, outputFilename);
        
        console.log('Output directory:', outputDir);
        console.log('Output filename:', outputPath);

        // Save the result to a file
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
        console.log('File written successfully to:', outputPath);

        // Send response with detailed file information
        res.json({
            message: 'File berhasil diproses dan disimpan',
            file_info: {
                input: { filename: req.file.originalname },
                output: {
                    filename: outputFilename,
                    directory: outputDir,
                    full_path: outputPath
                }
            },
            result
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint untuk memproses dari data manual
app.post('/process/manual', (req, res) => {
    try {
        const { fileName, data } = req.body;
        if (!fileName || !data || !Array.isArray(data)) {
            return res.status(400).json({ error: 'fileName dan array data harus disediakan' });
        }

        // Proses data
        const result = {};
        data.forEach(item => {
            const city = item.city;
            if (!result[city]) {
                result[city] = [];
            }
            if (!result[city].includes(item.postal_code)) {
                result[city].push(item.postal_code);
            }
        });

        // Urutkan kode pos
        Object.keys(result).forEach(city => {
            result[city].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        });

        // Simpan ke file output
        const outputDir = path.join(rootDir, 'output');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }
        const outputFilename = path.join(outputDir, fileName);

        fs.writeFileSync(outputFilename, JSON.stringify(result, null, 2), 'utf8');

        res.json({
            message: 'File berhasil dibuat dari input manual',
            outputFile: outputFilename,
            result: result
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add a simple test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Endpoint untuk download file output
app.get('/download/:filename', (req, res) => {
    const { filename } = req.params;
    const outputDir = path.join(rootDir, 'output');
    const filePath = path.join(outputDir, filename);

    // Cek apakah file ada
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, filename, (err) => {
        if (err) {
            console.error('Download error:', err);
            res.status(500).send('Error downloading file');
        }
    });
});

// Endpoint untuk menambahkan data ke file output JSON yang sudah ada
app.post('/append', (req, res) => {
    try {
        const { fileName, data, filePath } = req.body;
        if (!fileName || (!data && !filePath)) {
            return res.status(400).json({ error: 'fileName dan salah satu dari data atau filePath harus disediakan' });
        }

        const outputDir = path.join(rootDir, 'output');
        const outputFile = path.join(outputDir, fileName);

        if (!fs.existsSync(outputFile)) {
            return res.status(404).json({ error: 'File output tidak ditemukan' });
        }

        // Baca file output yang sudah ada
        let fileContent = fs.readFileSync(outputFile, 'utf8');
        let jsonData;
        try {
            jsonData = JSON.parse(fileContent);
        } catch (err) {
            return res.status(400).json({ error: 'Format JSON pada file output tidak valid' });
        }

        // Kumpulkan data baru dari filePath dan/atau data langsung
        let newData = [];
        if (filePath) {
            // Ambil path absolut
            const inputPath = path.isAbsolute(filePath) ? filePath : path.join(rootDir, filePath);
            if (!fs.existsSync(inputPath)) {
                return res.status(404).json({ error: 'File tambahan tidak ditemukan: ' + inputPath });
            }
            let tambahanContent = fs.readFileSync(inputPath, 'utf8');
            let tambahanData;
            try {
                tambahanData = JSON.parse(tambahanContent);
            } catch (err) {
                return res.status(400).json({ error: 'Format JSON pada file tambahan tidak valid' });
            }
            if (Array.isArray(tambahanData)) {
                newData = newData.concat(tambahanData);
            } else {
                newData.push(tambahanData);
            }
        }
        if (data) {
            if (Array.isArray(data)) {
                newData = newData.concat(data);
            } else {
                newData.push(data);
            }
        }

        // Tambahkan data baru ke struktur yang sudah ada
        newData.forEach(item => {
            const city = item.city;
            if (!jsonData[city]) {
                jsonData[city] = [];
            }
            if (!jsonData[city].includes(item.postal_code)) {
                jsonData[city].push(item.postal_code);
            }
        });

        // Urutkan kode pos pada setiap kota
        Object.keys(jsonData).forEach(city => {
            jsonData[city].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        });

        // Simpan ulang file output
        fs.writeFileSync(outputFile, JSON.stringify(jsonData, null, 2), 'utf8');

        res.json({
            message: 'Data berhasil ditambahkan dari file/data dan file diperbarui',
            outputFile: outputFile,
            result: jsonData
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log('Root directory:', rootDir);
}); 
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Get root directory of the project
const rootDir = path.resolve(__dirname);

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

app.post('/process', (req, res) => {
    try {
        const { filePath } = req.body;
        
        if (!filePath) {
            return res.status(400).json({ error: 'File path is required' });
        }

        // Log the input file path
        console.log('Input file path:', filePath);
        console.log('Root directory:', rootDir);

        // Get absolute path if relative path is provided
        const absoluteFilePath = path.isAbsolute(filePath) ? filePath : path.join(rootDir, filePath);
        console.log('Absolute file path:', absoluteFilePath);

        // Check if file exists
        if (!fs.existsSync(absoluteFilePath)) {
            return res.status(404).json({ error: 'File not found: ' + absoluteFilePath });
        }

        // Read and parse the JSON file
        const fileContent = fs.readFileSync(absoluteFilePath, 'utf8');
        let jsonData;
        
        try {
            jsonData = JSON.parse(fileContent);
        } catch (parseError) {
            return res.status(400).json({ error: 'Invalid JSON format in file: ' + parseError.message });
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

        // Nama file output sama dengan nama file input
        const originalFilename = path.basename(absoluteFilePath);
        const outputFilename = path.join(outputDir, originalFilename);
        
        console.log('Output directory:', outputDir);
        console.log('Output filename:', outputFilename);

        // Save the result to a file
        const outputData = result;
        fs.writeFileSync(outputFilename, JSON.stringify(outputData, null, 2), 'utf8');
        console.log('File written successfully to:', outputFilename);

        // Send response with detailed file information
        res.json({
            message: 'Processing completed successfully',
            file_info: {
                input: {
                    filename: path.basename(absoluteFilePath),
                    full_path: absoluteFilePath
                },
                output: {
                    filename: path.basename(outputFilename),
                    directory: outputDir,
                    full_path: outputFilename
                }
            },
            total_cities: Object.keys(result).length,
            total_postal_codes: Object.values(result).reduce((acc, arr) => acc + arr.length, 0),
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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log('Root directory:', rootDir);
}); 
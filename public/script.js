document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation ---
    const mainNav = document.querySelector('.main-nav');
    const newPageSubNav = document.querySelector('#page-new .sub-nav');

    const handleNav = (navElem, contentSelector, activeClass) => {
        navElem.addEventListener('click', (e) => {
            if (!e.target.matches('button')) return;

            // Update button active state
            navElem.querySelector(`.${activeClass}.active`).classList.remove('active');
            e.target.classList.add('active');

            // Update page/content visibility
            const targetId = e.target.dataset.target;
            document.querySelector(`${contentSelector}.active`).classList.remove('active');
            document.getElementById(targetId).classList.add('active');
        });
    };

    handleNav(mainNav, '.page', 'nav-btn');
    handleNav(newPageSubNav, '.sub-page', 'sub-nav-btn');

    // --- State and DOM elements ---
    const resultArea = document.getElementById('result-area');
    const downloadBtn = document.getElementById('download-result-btn');
    let manualDataList = [];

    // --- Helper Functions ---
    const showResult = (data) => {
        resultArea.textContent = JSON.stringify(data, null, 2);
        
        // Cek apakah response sukses dan mengandung informasi file output
        const outputFilename = data?.file_info?.output?.filename || data?.outputFile?.split(/[\\/]/).pop();

        if (outputFilename) {
            downloadBtn.href = `/download/${outputFilename}`;
            downloadBtn.download = outputFilename;
            downloadBtn.classList.remove('hidden');
        } else {
            downloadBtn.classList.add('hidden');
        }
    };

    const renderManualDataList = () => {
        const listElement = document.getElementById('manual-data-list');
        listElement.innerHTML = ''; // Clear list
        manualDataList.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <span class="city-name">${item.city}</span>
                    <span class="post-codes">${item.postal_codes.join(', ')}</span>
                </div>
            `;
            listElement.appendChild(li);
        });
    };

    // --- API Call Functions ---
    const callApi = async (endpoint, body) => {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const result = await response.json();
            showResult(result);
        } catch (error) {
            // Sembunyikan tombol download jika ada error
            downloadBtn.classList.add('hidden');
            showResult({ error: 'Terjadi kesalahan jaringan', details: error.message });
        }
    };

    // --- Event Listeners for Buttons ---

    // 1. Process new file (from upload)
    document.getElementById('process-btn').addEventListener('click', async () => {
        const fileInput = document.getElementById('process-file-input');
        if (fileInput.files.length === 0) {
            return showResult({ error: 'Silakan pilih file terlebih dahulu' });
        }

        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('jsonFile', file);

        try {
            const response = await fetch('/process', {
                method: 'POST',
                body: formData // No 'Content-Type' header needed, browser sets it for FormData
            });
            const result = await response.json();
            showResult(result);
        } catch (error) {
            // Sembunyikan tombol download jika ada error
            downloadBtn.classList.add('hidden');
            showResult({ error: 'Terjadi kesalahan jaringan', details: error.message });
        }
    });

    // 2. Handle file upload in the manual section
    document.getElementById('manual-upload-file').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const uploadedData = JSON.parse(e.target.result);
                if (!Array.isArray(uploadedData)) {
                    throw new Error('Format file harus berupa array JSON.');
                }

                // Merge data into manualDataList
                uploadedData.forEach(item => {
                    if (!item.city || !item.postal_code) return; // Skip invalid items

                    const existingCity = manualDataList.find(entry => entry.city === item.city);
                    if (existingCity) {
                        // Add postal code if it doesn't exist
                        if (!existingCity.postal_codes.includes(item.postal_code)) {
                            existingCity.postal_codes.push(item.postal_code);
                        }
                    } else {
                        // Add new city entry
                        manualDataList.push({ city: item.city, postal_codes: [item.postal_code] });
                    }
                });

                renderManualDataList(); // Update the UI
                alert('File berhasil dibaca dan data ditambahkan ke daftar!');

            } catch (err) {
                alert('Gagal mem-parsing file JSON: ' + err.message);
            } finally {
                // Reset file input so the same file can be uploaded again
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    });

    // 2b. Handle TXT upload in the manual section
    document.getElementById('manual-upload-txt').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const lines = e.target.result.split(/\r?\n/).map(line => line.trim()).filter(line => line);
                let added = 0;
                lines.forEach(line => {
                    // Format: kota kodepos, kodepos, kodepos
                    const match = line.match(/^([^\d]+)\s+([\d,;\s]+)$/i);
                    if (!match) return;
                    const city = match[1].trim();
                    const codes = match[2].split(/[;,]/).map(c => c.trim()).filter(c => c);
                    if (!city || codes.length === 0) return;

                    // Gabungkan ke manualDataList
                    const existingCity = manualDataList.find(entry => entry.city.toLowerCase() === city.toLowerCase());
                    if (existingCity) {
                        codes.forEach(code => {
                            if (!existingCity.postal_codes.includes(code)) {
                                existingCity.postal_codes.push(code);
                                added++;
                            }
                        });
                    } else {
                        manualDataList.push({ city, postal_codes: codes });
                        added += codes.length;
                    }
                });
                renderManualDataList();
                alert('File TXT berhasil diproses dan ' + added + ' kodepos ditambahkan ke daftar!');
            } catch (err) {
                alert('Gagal memproses file TXT: ' + err.message);
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    });

    // 3. Add manual data to list (from text input)
    document.getElementById('add-manual-data-btn').addEventListener('click', () => {
        const city = document.getElementById('manual-city').value.trim();
        const postcodesText = document.getElementById('manual-postcodes').value;

        if (!city || !postcodesText) {
            return alert('Nama Kota dan Kode Pos harus diisi!');
        }

        const postal_codes = postcodesText.split(/[;,]/).map(p => p.trim()).filter(p => p);
        if (postal_codes.length === 0) {
            return alert('Format Kode Pos tidak valid.');
        }

        // Merge with existing entry or create new one
        const existingCity = manualDataList.find(entry => entry.city === city);
        if (existingCity) {
            postal_codes.forEach(code => {
                if (!existingCity.postal_codes.includes(code)) {
                    existingCity.postal_codes.push(code);
                }
            });
        } else {
            manualDataList.push({ city, postal_codes });
        }
        
        renderManualDataList();

        // Clear inputs
        document.getElementById('manual-city').value = '';
        document.getElementById('manual-postcodes').value = '';
    });

    // 4. Create file from manual input
    document.getElementById('create-manual-file-btn').addEventListener('click', () => {
        const fileName = document.getElementById('manual-output-filename').value.trim();
        if (!fileName) return showResult({ error: 'Nama File Output Baru harus diisi' });
        if (manualDataList.length === 0) return showResult({ error: 'Daftar data masih kosong. Silakan tambah data terlebih dahulu.' });

        // Flatten data for backend
        const flatData = manualDataList.flatMap(item => 
            item.postal_codes.map(code => ({ city: item.city, postal_code: code }))
        );
        
        callApi('/process/manual', { fileName, data: flatData });
    });

    // 5. Append data to existing file
    document.getElementById('append-btn').addEventListener('click', () => {
        const fileName = document.getElementById('append-targetfile').value;
        const sourceFile = document.getElementById('append-sourcefile').value;
        const jsonDataText = document.getElementById('append-jsondata').value;

        if (!fileName) return showResult({ error: 'Nama File di Folder Output harus diisi' });

        const body = { fileName };
        if (sourceFile) body.filePath = sourceFile;
        if (jsonDataText) {
            try {
                body.data = JSON.parse(jsonDataText);
            } catch (e) {
                return showResult({ error: 'Format Data JSON Langsung tidak valid', details: e.message });
            }
        }
        
        if (!body.filePath && !body.data) return showResult({ error: 'Isi salah satu: Path File Tambahan atau Data JSON Langsung' });
        
        callApi('/append', body);
    });
}); 
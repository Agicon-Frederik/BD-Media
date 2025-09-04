class CSVAnalyzer {
    constructor() {
        this.currentTotalRecords = 0;
        this.currentRows = [];
        this.csvFile = document.getElementById('csvFile');
        this.resultsSection = document.getElementById('resultsSection');
        this.fileInfo = document.getElementById('fileInfo');
        this.totalRecords = document.getElementById('totalRecords');
        this.uniqueNotes = document.getElementById('uniqueNotes');
        this.notesList = document.getElementById('notesList');
        this.driverForm = document.getElementById('driverForm');
        this.driverResult = document.getElementById('driverResult');
        this.initializeEventListeners();
    }
    initializeEventListeners() {
        this.csvFile.addEventListener('change', (event) => {
            this.handleFileUpload(event);
        });
        this.driverForm.addEventListener('submit', (event) => {
            this.handleDriverFormSubmit(event);
        });
    }
    handleFileUpload(event) {
        var _a;
        const target = event.target;
        const file = (_a = target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (file && file.type === 'text/csv') {
            this.readCSVFile(file);
        }
        else {
            alert('Please select a valid CSV file.');
        }
    }
    readCSVFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            var _a;
            const csvContent = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
            this.parseAndAnalyzeCSV(csvContent, file);
        };
        reader.readAsText(file);
    }
    parseAndAnalyzeCSV(csvContent, file) {
        const lines = csvContent.split('\n');
        const headers = this.parseCSVLine(lines[0]);
        // Find the index of the Note column
        const noteColumnIndex = headers.findIndex(header => header.toLowerCase().includes('note'));
        if (noteColumnIndex === -1) {
            alert('No "Note" column found in the CSV file.');
            return;
        }
        const rows = [];
        const noteFrequencyMap = new Map();
        // Parse data rows (skip header)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const values = this.parseCSVLine(line);
                if (values.length > noteColumnIndex) {
                    const note = values[noteColumnIndex].trim();
                    if (note) {
                        // Clean the note text (remove quotes if present)
                        const cleanNote = note.replace(/^"(.*)"$/, '$1');
                        // Update frequency count
                        noteFrequencyMap.set(cleanNote, (noteFrequencyMap.get(cleanNote) || 0) + 1);
                        // Create row object (simplified for this example)
                        const row = {
                            stopNumber: values[0] || '',
                            stopId: values[1] || '',
                            date: values[2] || '',
                            bezoekenNa: values[3] || '',
                            bezoekenVoor: values[4] || '',
                            name: values[5] || '',
                            street: values[6] || '',
                            houseNo: values[7] || '',
                            postalCode: values[8] || '',
                            city: values[9] || '',
                            note: cleanNote,
                            storedAddress: values[11] || '',
                            route: values[12] || '',
                            email: values[13] || '',
                            telephoneNumber: values[14] || '',
                            plannedDistance: values[15] || '',
                            plannedDuration: values[16] || '',
                            eta: values[17] || ''
                        };
                        rows.push(row);
                    }
                }
            }
        }
        // Convert map to sorted array
        const noteFrequencies = Array.from(noteFrequencyMap.entries())
            .map(([note, count]) => ({ note, count }))
            .sort((a, b) => b.count - a.count);
        this.displayResults(file, rows, noteFrequencies);
    }
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Handle escaped quotes
                    current += '"';
                    i++; // Skip next quote
                }
                else {
                    inQuotes = !inQuotes;
                }
            }
            else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            }
            else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }
    displayResults(file, rows, noteFrequencies) {
        // Show results section
        this.resultsSection.style.display = 'block';
        // Display file information
        this.fileInfo.innerHTML = `
            <p><strong>File Name:</strong> ${file.name}</p>
            <p><strong>File Size:</strong> ${this.formatFileSize(file.size)}</p>
            <p><strong>Last Modified:</strong> ${new Date(file.lastModified).toLocaleString()}</p>
        `;
        // Store rows for helper calculations
        this.currentRows = rows;
        // Display statistics
        this.currentTotalRecords = rows.length;
        this.totalRecords.textContent = rows.length.toString();
        this.uniqueNotes.textContent = noteFrequencies.length.toString();
        // Display notes frequency list
        this.notesList.innerHTML = '';
        noteFrequencies.forEach(({ note, count }) => {
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item';
            noteItem.innerHTML = `
                <span class="note-text">${this.escapeHtml(note)}</span>
                <span class="note-count">${count}</span>
            `;
            this.notesList.appendChild(noteItem);
        });
    }
    handleDriverFormSubmit(event) {
        event.preventDefault();
        const formData = new FormData(this.driverForm);
        const originalDriver = formData.get('originalDriver');
        const helperName = formData.get('helperName');
        const papersToTake = parseInt(formData.get('papersToTake'));
        if (!originalDriver || !helperName || !papersToTake || papersToTake <= 0) {
            alert('Please fill in all fields with valid values.');
            return;
        }
        if (papersToTake >= this.currentTotalRecords) {
            alert(`Number of papers to take (${papersToTake}) must be less than total records (${this.currentTotalRecords}).`);
            return;
        }
        const stopNumber = this.currentTotalRecords - papersToTake;
        const helperNewspapers = this.calculateHelperNewspapers(stopNumber);
        this.displayDriverResult(originalDriver, helperName, papersToTake, stopNumber, helperNewspapers);
    }
    calculateHelperNewspapers(startStopNumber) {
        // Get rows from the start stop number to the end
        const helperRows = this.currentRows.slice(startStopNumber);
        // Count frequency of each note type for helper
        const helperNoteMap = new Map();
        helperRows.forEach(row => {
            if (row.note) {
                helperNoteMap.set(row.note, (helperNoteMap.get(row.note) || 0) + 1);
            }
        });
        // Convert to array and sort by count
        return Array.from(helperNoteMap.entries())
            .map(([note, count]) => ({ note, count }))
            .sort((a, b) => b.count - a.count);
    }
    displayDriverResult(originalDriver, helperName, papersToTake, stopNumber, helperNewspapers) {
        this.driverResult.style.display = 'block';
        let helperBreakdownHtml = '';
        if (helperNewspapers.length > 0) {
            helperBreakdownHtml = `
                <div class="helper-breakdown">
                    <h4>Newspapers ${this.escapeHtml(helperName)} needs to take:</h4>
                    <div class="helper-newspapers">
                        ${helperNewspapers.map(({ note, count }) => `
                            <div class="helper-newspaper-item">
                                <span class="newspaper-type">${this.escapeHtml(note)}</span>
                                <span class="newspaper-count">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        this.driverResult.innerHTML = `
            <h3>Driver Assignment Result</h3>
            <p><strong>${this.escapeHtml(originalDriver)}</strong> will stop at Stop Number: <strong>${stopNumber}</strong></p>
            <p><strong>${this.escapeHtml(helperName)}</strong> will take <strong>${papersToTake}</strong> papers from that point onwards.</p>
            ${helperBreakdownHtml}
        `;
    }
    formatFileSize(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CSVAnalyzer();
});

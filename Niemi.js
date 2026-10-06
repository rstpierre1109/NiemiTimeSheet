// ==========================================
// UNIFIED MASTER STRUCTURE INITIALIZATION
// ==========================================
let corporateData = {
    jobs: [],
    employees: [],
    equipment: [],
    phases: []
};

// ==========================================
// SELECTION PICKLIST RENDERING ENGINE
// ==========================================
// ==========================================
// DYNAMIC MULTI-SELECT CHECKBOX INJECTION
// ==========================================
function populateTimesheetPicklists() {
    if (!corporateData) return;

    // Load previously preserved checkbox values before rendering UI list nodes
    let savedSelections = {};
    try {
        const stored = localStorage.getItem(STORAGE_SELECTIONS_KEY);
        if (stored) savedSelections = JSON.parse(stored);
    } catch (e) {
        console.error("Failed parsing persistent picklist selection maps:", e);
    }

    // 1. Refresh Jobs Standard Dropdown Selector
    const jobSelect = document.getElementById('select-job');
    if (jobSelect) {
        jobSelect.innerHTML = '<option value="">-- Select Job --</option>';
        if (Array.isArray(corporateData.jobs)) {
            corporateData.jobs.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.JobNumber;
                opt.textContent = `${item.JobNumber} | ${item.Project || item.Contractor || ''}`;
                jobSelect.appendChild(opt);
            });
        }
    }

    // 2. Inject Employee Multi-Select Checkboxes
    const empContainer = document.getElementById('checkboxContainerEmp');
    if (empContainer) {
        empContainer.innerHTML = '';
        if (Array.isArray(corporateData.employees) && corporateData.employees.length > 0) {
            corporateData.employees.forEach(item => {
                const isChecked = Array.isArray(savedSelections.employees) && savedSelections.employees.includes(item.Name);
                const label = document.createElement('label');
                label.className = 'option-item';
                label.innerHTML = `
                    <input type="checkbox" name="selected-employees" value="${item.Name}" ${isChecked ? 'checked' : ''}>
                    <span>${item.Name} <small style="color: var(--text-light); font-size: 11px;">[${item.Class || ''}]</small></span>
                `;
                empContainer.appendChild(label);
            });
        } else {
            empContainer.innerHTML = '<div style="color: var(--text-light); font-size: 13px; padding: 8px;">No employees registered yet.</div>';
        }
    }

    // 3. Inject Equipment Multi-Select Checkboxes
    const eqContainer = document.getElementById('checkboxContainerEquip');
    if (eqContainer) {
        eqContainer.innerHTML = '';
        if (Array.isArray(corporateData.equipment) && corporateData.equipment.length > 0) {
            corporateData.equipment.forEach(item => {
                const isChecked = Array.isArray(savedSelections.equipment) && savedSelections.equipment.includes(item.EquipmentName);
                const label = document.createElement('label');
                label.className = 'option-item';
                label.innerHTML = `
                    <input type="checkbox" name="selected-equipment" value="${item.EquipmentName}" ${isChecked ? 'checked' : ''}>
                    <span>${item.EquipmentName}</span>
                `;
                eqContainer.appendChild(label);
            });
        } else {
            eqContainer.innerHTML = '<div style="color: var(--text-light); font-size: 13px; padding: 8px;">No equipment registered yet.</div>';
        }
    }

    // 4. Inject Job Phase Multi-Select Checkboxes
    const phaseContainer = document.getElementById('checkboxContainerPhases');
    if (phaseContainer) {
        phaseContainer.innerHTML = '';
        if (Array.isArray(corporateData.phases) && corporateData.phases.length > 0) {
            corporateData.phases.forEach(item => {
                const isChecked = Array.isArray(savedSelections.phases) && savedSelections.phases.includes(item.PhaseName);
                const label = document.createElement('label');
                label.className = 'option-item';
                label.innerHTML = `
                    <input type="checkbox" name="selected-phases" value="${item.PhaseName}" ${isChecked ? 'checked' : ''}>
                    <span>${item.PhaseName}</span>
                `;
                phaseContainer.appendChild(label);
            });
        } else {
            phaseContainer.innerHTML = '<div style="color: var(--text-light); font-size: 13px; padding: 8px;">No workflow phases registered yet.</div>';
        }
    }

    // Update Live Tracking Stats Top Ribbon Counts
    const jobsCountBadge = document.getElementById('total-jobs-count');
    if (jobsCountBadge && Array.isArray(corporateData.jobs)) {
        jobsCountBadge.textContent = corporateData.jobs.length;
    }

    // Sync closable layout tags to match active checkbox values seamlessly
    updateClosableTags('multiselect-emp', 'tagsContainerEmp', 'selected-employees');
    updateClosableTags('multiselect-equip', 'tagsContainerEquip', 'selected-equipment');
    updateClosableTags('multiselect-phase', 'tagsContainerPhase', 'selected-phases');
}

// ==========================================
// INITIALIZE DROPDOWN INTERACTIONS (RUNS ONCE)
// ==========================================
function initDropdownEvents(containerId, selectBoxId, tagsContainerId, checkboxName) {
    const container = document.getElementById(containerId);
    const selectBox = document.getElementById(selectBoxId);
    if (!container || !selectBox) return;

    // Toggle active dropdown view on select box clicks safely without cloning
    selectBox.addEventListener('click', function(e) {
        if (e.target.classList.contains('tag-close')) return;
        
        document.querySelectorAll('.multiselect-container').forEach(el => {
            if (el !== container) el.classList.remove('active');
        });
        
        container.classList.toggle('active');
    });

    // Use Event Delegation to listen for checkbox modifications inside the container panel
    container.addEventListener('change', function(e) {
        if (e.target.matches(`input[name="${checkboxName}"]`)) {
            saveCurrentSelectionsToCache();
            updateClosableTags(containerId, tagsContainerId, checkboxName);
        }
    });
}

// ==========================================
// INTERACTIVE WINDOW DROPDOWN EVENT HANDLERS
// ==========================================
function setupDropdownInteractions(containerId, selectBoxId, tagsContainerId, checkboxName) {
    const container = document.getElementById(containerId);
    const selectBox = document.getElementById(selectBoxId);
    if (!container || !selectBox) return;

    // Remove any old event listeners by replacing the element with a clone
    const oldSelectBox = selectBox;
    const newSelectBox = oldSelectBox.cloneNode(true);
    oldSelectBox.parentNode.replaceChild(newSelectBox, oldSelectBox);

    // Toggle active dropdown view on container box action clicks
    newSelectBox.addEventListener('click', function(e) {
        if (e.target.classList.contains('tag-close')) return;
        
        // Hide other open dropdown panels first for a cleaner user interaction flow
        document.querySelectorAll('.multiselect-container').forEach(el => {
            if (el !== container) el.classList.remove('active');
        });
        
        container.classList.toggle('active');
    });

    // Handle check boxes click action bubbles cleanly
    container.querySelectorAll(`input[name="${checkboxName}"]`).forEach(cb => {
        cb.addEventListener('change', function() {
            saveCurrentSelectionsToCache();
            updateClosableTags(containerId, tagsContainerId, checkboxName);
        });
    });

    // Run primary initial tag draw sweep processing instantly
    updateClosableTags(containerId, tagsContainerId, checkboxName);
}

// Helper to handle drawing inner table rows safely
function populateTableHTML(tableId, dataList, propertyKeys) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (Array.isArray(dataList)) {
        dataList.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = propertyKeys.map(key => `<td>${item[key] || ''}</td>`).join('');
            tbody.appendChild(tr);
        });
    }
}

function refreshAllManagementTables() {
    populateTableHTML('table-config-jobs', corporateData.jobs, ['JobNumber', 'Contractor', 'Owner', 'Project']);
    populateTableHTML('table-config-employees', corporateData.employees, ['Name', 'Class']);
    populateTableHTML('table-config-equipment', corporateData.equipment, ['EquipmentName']);
    populateTableHTML('table-config-phases', corporateData.phases, ['PhaseName']);
}

// ==========================================
// SYSTEM AUTO-LOAD TRIGGER (ON LAUNCH)
// ==========================================
//document.addEventListener('DOMContentLoaded', function() {
//    const savedLocalSession = localStorage.getItem('niemi_corporate_master_list');
//    
//    if (savedLocalSession) {
//        try {
//            const parsedBackup = JSON.parse(savedLocalSession);
//            if (parsedBackup && typeof parsedBackup === 'object') {
//                // Safely assign arrays without dropping keys
//                corporateData.jobs = parsedBackup.jobs || [];
//                corporateData.employees = parsedBackup.employees || [];
//                corporateData.equipment = parsedBackup.equipment || [];
//                corporateData.phases = parsedBackup.phases || [];
//                console.log("Data successfully loaded from browser memory sandbox.");
//            }
//        } catch (e) {
//            console.error("Bypassed corrupt storage sequence stream:", e);
//        }
//    }

    // Safely render interface layout
//    refreshAllManagementTables();
//    populateTimesheetPicklists();
//});

// ==========================================
// SYSTEM AUTO-LOAD TRIGGER (ON LAUNCH)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const savedLocalSession = localStorage.getItem('niemi_corporate_master_list');
    
    if (savedLocalSession) {
        try {
            const parsedBackup = JSON.parse(savedLocalSession);
            if (parsedBackup && typeof parsedBackup === 'object') {
                corporateData.jobs = parsedBackup.jobs || [];
                corporateData.employees = parsedBackup.employees || [];
                corporateData.equipment = parsedBackup.equipment || [];
                corporateData.phases = parsedBackup.phases || [];
                console.log("Master lists successfully populated from internal browser cache storage.");
            }
        } catch (e) {
            console.error("Bypassed corrupt storage sequence stream:", e);
        }
    }

    refreshAllManagementTables();
    
    // 1. Setup persistent window click handlers ONCE
    initDropdownEvents('multiselect-emp', 'selectBoxEmp', 'tagsContainerEmp', 'selected-employees');
    initDropdownEvents('multiselect-equip', 'selectBoxEquip', 'tagsContainerEquip', 'selected-equipment');
    initDropdownEvents('multiselect-phase', 'selectBoxPhase', 'tagsContainerPhase', 'selected-phases');

    // 2. Inject parameters from localStorage data cache pipelines
    populateTimesheetPicklists();

    // Global document listener to handle outer clicks and minimize dropdown boxes automatically
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.multiselect-container')) {
            document.querySelectorAll('.multiselect-container').forEach(el => el.classList.remove('active'));
        }
    });
});

// ==========================================
// PANEL CLICK DATA APPENDER LISTENERS
// ==========================================
document.getElementById('addBtn').addEventListener('click', function(e) {
    e.preventDefault();
    const j1 = document.getElementById('config-job-name-1').value.trim();
    const j2 = document.getElementById('config-job-name-2').value.trim();
    const j3 = document.getElementById('config-job-name-3').value.trim();
    const j4 = document.getElementById('config-job-name-4').value.trim();

    if (!j1 || !j2 || !j3 || !j4) return alert("Please fill out all 4 Job Details fields.");

    // APPENDS item safely to existing array track
    corporateData.jobs.push({ JobNumber: j1, Contractor: j2, Owner: j3, Project: j4 });
    
    // Automatically auto-save to browser local storage so memory states match instantly
    localStorage.setItem('niemi_corporate_master_list', JSON.stringify(corporateData));
    
    populateTableHTML('table-config-jobs', corporateData.jobs, ['JobNumber', 'Contractor', 'Owner', 'Project']);
    populateTimesheetPicklists();

    document.getElementById('config-job-name-1').value = '';
    document.getElementById('config-job-name-2').value = '';
    document.getElementById('config-job-name-3').value = '';
    document.getElementById('config-job-name-4').value = '';
});

document.getElementById('addEmpBtn').addEventListener('click', function(e) {
    e.preventDefault();
    const e1 = document.getElementById('config-emp-name-1').value.trim();
    const e2 = document.getElementById('config-emp-name-2').value.trim();

    if (!e1 || !e2) return alert("Please fill out both Employee Name and Class fields.");

    // APPENDS item safely
    corporateData.employees.push({ Name: e1, Class: e2 });
    localStorage.setItem('niemi_corporate_master_list', JSON.stringify(corporateData));
    
    populateTableHTML('table-config-employees', corporateData.employees, ['Name', 'Class']);
    populateTimesheetPicklists();

    document.getElementById('config-emp-name-1').value = '';
    document.getElementById('config-emp-name-2').value = '';
});

document.getElementById('addEquipmentBtn').addEventListener('click', function(e) {
    e.preventDefault();
    const eq = document.getElementById('config-eq-name').value.trim();

    if (!eq) return alert("Please provide an equipment name.");

    // APPENDS item safely
    corporateData.equipment.push({ EquipmentName: eq });
    localStorage.setItem('niemi_corporate_master_list', JSON.stringify(corporateData));
    
    populateTableHTML('table-config-equipment', corporateData.equipment, ['EquipmentName']);
    populateTimesheetPicklists();

    document.getElementById('config-eq-name').value = '';
});

document.getElementById('addPhaseBtn').addEventListener('click', function(e) {
    e.preventDefault();
    const ph = document.getElementById('config-phase-name').value.trim();

    if (!ph) return alert("Please provide a phase name.");

    // APPENDS item safely
    corporateData.phases.push({ PhaseName: ph });
    localStorage.setItem('niemi_corporate_master_list', JSON.stringify(corporateData));
    
    populateTableHTML('table-config-phases', corporateData.phases, ['PhaseName']);
    populateTimesheetPicklists();

    document.getElementById('config-phase-name').value = '';
});

// ==========================================
// PERSISTENT COMMIT DATA MASTER CONTROLLERS
// ==========================================
document.getElementById('downloadBtn').addEventListener('click', function() {
    const jsonString = JSON.stringify(corporateData, null, 2);

    // Backup to browser cache
    localStorage.setItem('niemi_corporate_master_list', jsonString);

    // Save actual file backup download stream to hard drive
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = "corporate_master_settings.json";
    link.click();
    
    URL.revokeObjectURL(url);
    alert("Master lists saved and file backup downloaded successfully!");
});

// Safe Backup Loader: Appends file values onto current memory without wiping data
document.getElementById('uploadCorporateFile').addEventListener('change', function(e) {
    const file = e.target.files;
    if (!file || file.length === 0) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {

            const parsedBackup = JSON.parse(event.target.result);
            if (parsedBackup && typeof parsedBackup === 'object') {
            // SAFE PRESERVATION: Merges active memory with imported structures using spread arrays
                corporateData.jobs = [...corporateData.jobs, ...(parsedBackup.jobs || [])];
                corporateData.employees = [...corporateData.employees, ...(parsedBackup.employees || [])];
                corporateData.equipment = [...corporateData.equipment, ...(parsedBackup.equipment || [])];
                corporateData.phases = [...corporateData.phases, ...(parsedBackup.phases || [])];
                // Commit the merged records directly to internal localStorage
                localStorage.setItem('niemi_corporate_master_list', JSON.stringify(corporateData));
                // Re-render UI components instantly with merged results
                refreshAllManagementTables();
                populateTimesheetPicklists();
                alert("Data uploaded and appended successfully without losing existing records!");
            }
        } catch (err) {
          alert("Failed to parse file. Make sure it is a valid settings .json profile.");
          console.error(err);
        }       
};
reader.readAsText(file);
// Clear the field tracker so uploading the same file twice triggers the script again
this.value = '';
});

// ==========================================
// DYNAMIC TIMESHEET MATRIX GENERATOR
// ==========================================
function submitMatrixLog(event) {
    if (event) event.preventDefault();

    // 1. Gather Selected Job Meta Details
    const jobSelect = document.getElementById('select-job');
    const selectedJobId = jobSelect.value;
    
    if (!selectedJobId) {
        return alert("Please select an active Job ID / Code first.");
    }

    // Find the full corporate details associated with this Job Number
    const activeJob = corporateData.jobs.find(j => j.JobNumber === selectedJobId);
    
    // 2. Fetch Selected Multi-Select Values from Live Checkboxes
    const selectedEmployees = Array.from(document.querySelectorAll('input[name="selected-employees"]:checked')).map(cb => cb.value);
    const selectedEquipment = Array.from(document.querySelectorAll('input[name="selected-equipment"]:checked')).map(cb => cb.value);
    const selectedPhases = Array.from(document.querySelectorAll('input[name="selected-phases"]:checked')).map(cb => cb.value);

    // Enforce basic verification constraints
    if (selectedPhases.length === 0) {
        return alert("Please pick at least one Job Phase column to build the allocation grid matrix.");
    }
    if (selectedEmployees.length === 0 && selectedEquipment.length === 0) {
        return alert("Please pick at least one Employee or Equipment asset to log hours against.");
    }

    // 3. Update top meta summary info view elements safely
    const banner = document.getElementById('active-job-banner');
    if (banner && activeJob) {
        document.getElementById('lbl-job-num').textContent = activeJob.JobNumber;
        document.getElementById('lbl-job-project').textContent = activeJob.Project || 'N/A';
        document.getElementById('lbl-job-contractor').textContent = activeJob.Contractor || 'N/A';
        document.getElementById('lbl-job-owner').textContent = activeJob.Owner || 'N/A';
        banner.style.display = 'block'; // Make metadata visible
    }

    // 4. Generate Table Headers Dynamically (Phases + Summary Columns)
    const tableHeader = document.querySelector('#matrix-display-table thead');
    if (tableHeader) {
        let headerRowHTML = `
            <tr>
                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; background-color: #f8fafc;">Resources</th>
                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; background-color: #f8fafc; width: 100px;">Classification</th>
        `;
        
        // Append selected phase items horizontally
        selectedPhases.forEach(phase => {
            headerRowHTML += `<th style="padding: 10px; border-bottom: 2px solid #cbd5e1; background-color: #f8fafc; text-align: center;">${phase}</th>`;
        });
        
        // Append the three tracking columns at the end of the header row
        headerRowHTML += `
            <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; background-color: #e2e8f0; text-align: center; width: 90px; color: #1e293b;">Total Hours</th>
            <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; background-color: #f1f5f9; text-align: center; width: 100px;">Time In</th>
            <th style="padding: 10px; border-bottom: 2px solid #cbd5e1; background-color: #f1f5f9; text-align: center; width: 100px;">Time Out</th>
        </tr>`;
        
        tableHeader.innerHTML = headerRowHTML;
    }

    // 5. Generate Data Rows Dynamically
    const tableBody = document.getElementById('matrix-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = ''; // Reset layout buffer row targets

    // --- Part A: Append Employee Section Rows ---
    if (selectedEmployees.length > 0) {
        selectedEmployees.forEach((empName, empIndex) => {
            const empMeta = corporateData.employees.find(e => e.Name === empName);
            const empClass = empMeta ? empMeta.Class : 'Laborer';

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #e2e8f0';
            
            let rowHTML = `
                <td style="padding: 8px 10px; font-weight: bold; color: #1e293b;">👤 ${empName}</td>
                <td style="padding: 8px 10px; color: #64748b; font-size: 13px;">${empClass}</td>
            `;

            // Phase inputs
            selectedPhases.forEach((phase) => {
                rowHTML += `
                    <td style="padding: 4px; text-align: center;">
                        <input type="number" 
                               class="hours-input labor-hours row-item-emp-${empIndex}" 
                               data-resource="${empName}" 
                               data-phase="${phase}" 
                               min="0" max="24" step="0.25" placeholder="0.00" 
                               style="width: 70px; text-align: center; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px;"
                               oninput="recalculateRowTotal('emp', ${empIndex}); recalculateTotalLoggedHours();">
                    </td>`;
            });

            // Pre-populated summary data and standard 24-hour default time strings
            rowHTML += `
                <td style="padding: 4px; text-align: center; font-weight: bold; color: #1e293b; background-color: #f8fafc;" id="total-row-emp-${empIndex}">0.00</td>
                <td style="padding: 4px; text-align: center;"><input type="time" value="07:00" class="time-in-input" style="padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;"></td>
                <td style="padding: 4px; text-align: center;"><input type="time" value="15:30" class="time-out-input" style="padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;"></td>
            `;

            tr.innerHTML = rowHTML;
            tableBody.appendChild(tr);
        });
    }

    // --- Part B: Append Equipment Asset Section Rows ---
    if (selectedEquipment.length > 0) {
        selectedEquipment.forEach((equipName, equipIndex) => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #e2e8f0';
            tr.style.backgroundColor = '#fdfdfd';

            let rowHTML = `
                <td style="padding: 8px 10px; font-weight: bold; color: #0f172a;">⚙️ ${equipName}</td>
                <td style="padding: 8px 10px; color: #94a3b8; font-size: 13px; font-style: italic;">Machinery</td>
            `;

            // Phase inputs
            selectedPhases.forEach((phase) => {
                rowHTML += `
                    <td style="padding: 4px; text-align: center;">
                        <input type="number" 
                               class="hours-input equip-hours row-item-equip-${equipIndex}" 
                               data-resource="${equipName}" 
                               data-phase="${phase}" 
                               min="0" max="24" step="0.25" placeholder="0.00" 
                               style="width: 70px; text-align: center; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; background-color: #fafafa;"
                               oninput="recalculateRowTotal('equip', ${equipIndex}); recalculateTotalLoggedHours();">
                    </td>`;
            });

            // Pre-populated summary data and standard 24-hour default time strings
            rowHTML += `
                <td style="padding: 4px; text-align: center; font-weight: bold; color: #1e293b; background-color: #f8fafc;" id="total-row-equip-${equipIndex}">0.00</td>
                <td style="padding: 4px; text-align: center;"><input type="time" value="07:00" class="time-in-input" style="padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;"></td>
                <td style="padding: 4px; text-align: center;"><input type="time" value="15:30" class="time-out-input" style="padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;"></td>
            `;

            tr.innerHTML = rowHTML;
            tableBody.appendChild(tr);
        });
    }
    // --- Part B: Append Equipment Asset Section Rows ---
    if (selectedEquipment.length > 0) {
        selectedEquipment.forEach((equipName, equipIndex) => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #e2e8f0';
            tr.style.backgroundColor = '#fdfdfd';

            let rowHTML = `
                <td style="padding: 8px 10px; font-weight: bold; color: #0f172a;">⚙️ ${equipName}</td>
                <td style="padding: 8px 10px; color: #94a3b8; font-size: 13px; font-style: italic;">Machinery</td>
            `;

            // Phase inputs
            selectedPhases.forEach((phase) => {
                rowHTML += `
                    <td style="padding: 4px; text-align: center;">
                        <input type="number" 
                               class="hours-input equip-hours row-item-equip-${equipIndex}" 
                               data-resource="${equipName}" 
                               data-phase="${phase}" 
                               min="0" max="24" step="0.25" placeholder="0.00" 
                               style="width: 70px; text-align: center; padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; background-color: #fafafa;"
                               oninput="recalculateRowTotal('equip', ${equipIndex}); recalculateTotalLoggedHours();">
                    </td>`;
            });

            // Append summary and entry columns at the end of the phase elements
            rowHTML += `
                <td style="padding: 4px; text-align: center; font-weight: bold; color: #1e293b; background-color: #f8fafc;" id="total-row-equip-${equipIndex}">0.00</td>
                <td style="padding: 4px; text-align: center;"><input type="time" class="time-in-input" style="padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;"></td>
                <td style="padding: 4px; text-align: center;"><input type="time" class="time-out-input" style="padding: 4px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px;"></td>
            `;

            tr.innerHTML = rowHTML;
            tableBody.appendChild(tr);
        });
    }
}

// ==========================================
// INDIVIDUAL ROW ACCUMULATOR TOTAL CALCULATOR
// ==========================================
function recalculateRowTotal(type, index) {
    let rowSum = 0;
    // Query target inputs matching this row's index parameter token
    const inputs = document.querySelectorAll(`.row-item-${type}-${index}`);
    
    inputs.forEach(input => {
        const val = parseFloat(input.value);
        if (!isNaN(val) && val > 0) {
            rowSum += val;
        }
    });

    // Write value into the dedicated inline cell
    const targetCell = document.getElementById(`total-row-${type}-${index}`);
    if (targetCell) {
        targetCell.textContent = rowSum.toFixed(2);
    }
}



// ==========================================
// STATS CARD LIVE GLOBAL RE-CALCULATION GENERATOR
// ==========================================
function recalculateTotalLoggedHours() {
let totalLabor = 0;
let totalEquip = 0;
// Aggregate Labor Input Elements
document.querySelectorAll('.labor-hours').forEach(input => {
const val = parseFloat(input.value);
if (!isNaN(val) && val > 0) totalLabor += val;
});

// Aggregate Equipment Input Elements
document.querySelectorAll('.equip-hours').forEach(input => {
const val = parseFloat(input.value);
if (!isNaN(val) && val > 0) totalEquip += val;
});

// Sync views back safely to the top UI summary ribbons
const laborBadge = document.getElementById('total-labor-hrs');
if (laborBadge) laborBadge.textContent = totalLabor.toFixed(2);
const equipBadge = document.getElementById('total-equip-hrs');
if (equipBadge) equipBadge.textContent = totalEquip.toFixed(2);
}


// ==========================================
// STATS CARD LIVE RE-CALCULATION GENERATOR
// ==========================================
function recalculateTotalLoggedHours() {
    let totalLabor = 0;
    let totalEquip = 0;

    // Aggregate Labor Input Elements
    document.querySelectorAll('.labor-hours').forEach(input => {
        const val = parseFloat(input.value);
        if (!isNaN(val) && val > 0) totalLabor += val;
    });

    // Aggregate Equipment Input Elements
    document.querySelectorAll('.equip-hours').forEach(input => {
        const val = parseFloat(input.value);
        if (!isNaN(val) && val > 0) totalEquip += val;
    });

    // Sync views back safely to the top UI summary ribbons
    const laborBadge = document.getElementById('total-labor-hrs');
    if (laborBadge) laborBadge.textContent = totalLabor.toFixed(2);

    const equipBadge = document.getElementById('total-equip-hrs');
    if (equipBadge) equipBadge.textContent = totalEquip.toFixed(2);
}

// ==========================================
// EXCEL-COMPATIBLE TIMESHEET CSV EXPORTER
// ==========================================
function exportTimesheetCSV() {
    // 1. Verify that an active job matrix has been built first
    const tableHeader = document.querySelector('#matrix-display-table thead tr');
    const laborRows = document.querySelectorAll('#matrix-table-body tr:not([style*="background-color"])');
    const equipRows = document.querySelectorAll('#matrix-table-body tr[style*="background-color"]');
    
    if (!tableHeader || (laborRows.length === 0 && equipRows.length === 0)) {
        return alert("There is no active timesheet matrix data to export. Please build a timesheet first.");
    }

    // 2. Fetch Active Meta Form Parameters Safely
    const inputDate = document.getElementById('input-date').value || new Date().toLocaleDateString();
    const jobId = document.getElementById('lbl-job-num').textContent || 'N/A';
    const project = document.getElementById('lbl-job-project').textContent || 'N/A';
    const contractor = document.getElementById('lbl-job-contractor').textContent || 'N/A';
    const owner = document.getElementById('lbl-job-owner').textContent || 'N/A';
    const remarks = document.getElementById('input-notes').value.trim() || 'No active remarks logged for this shift sequence.';

    // Helper closure utility to wrap spreadsheet cells securely to prevent CSV format breaks
    const escapeCSV = (text) => {
        if (!text) return '""';
        let str = text.toString().replace(/"/g, '""'); 
        return `"${str}"`;
    };

    // 3. Assemble Top Corporate Meta Header Section (Rows 1 to 5)
    let csvContent = [];
    csvContent.push(`"NIEMI CORPORATION TIMESHEET",,,,,,`); 
    csvContent.push(`"Date:",${escapeCSV(inputDate)},,,,,,`);
    csvContent.push(`"Job ID / Code:",${escapeCSV(jobId)},"Project Name:",${escapeCSV(project)},,,,`);
    csvContent.push(`"Contractor:",${escapeCSV(contractor)},"Owner Name:",${escapeCSV(owner)},,,,`);
    csvContent.push(`,,,,,,`); 

    // 4. Assemble Matrix Main Columns Headers with an added separator gap
    let headerCells = [];
    const rawHeaders = tableHeader.querySelectorAll('th');
    if (rawHeaders.length > 0) {
        headerCells.push(escapeCSV(rawHeaders[0].textContent.trim())); // Resources Column Header
        headerCells.push(escapeCSV(rawHeaders[1].textContent.trim())); // Classification Column Header
        headerCells.push('""'); // GAPPED INJECTION: Adds a blank space column separating resource details from job phases
        
        // Loop and add the rest of the dynamic headers (Phases, Total, Time In, Time Out)
        for (let i = 2; i < rawHeaders.length; i++) {
            headerCells.push(escapeCSV(rawHeaders[i].textContent.trim()));
        }
    }
    csvContent.push(headerCells.join(','));

    // Helper logic block to map row values into CSV formatting strings standardly
    const processRowElements = (rowElement) => {
        let rowCells = [];
        const cells = rowElement.querySelectorAll('td');
        if (cells.length > 0) {
            rowCells.push(escapeCSV(cells[0].textContent.trim())); // Resource Identity
            rowCells.push(escapeCSV(cells[1].textContent.trim())); // Classification Meta Label
            rowCells.push('""'); // GAPPED INJECTION: Adds an matching empty column cell structural spacer
            
            // Loop through variable horizontal entry input cells safely
            for (let i = 2; i < cells.length; i++) {
                const numInput = cells[i].querySelector('input[type="number"]');
                const timeInput = cells[i].querySelector('input[type="time"]');
                
                if (numInput) {
                    const hoursVal = parseFloat(numInput.value);
                    rowCells.push(isNaN(hoursVal) ? '"0.00"' : `"${hoursVal.toFixed(2)}"` );
                } else if (timeInput) {
                    rowCells.push(escapeCSV(timeInput.value));
                } else {
                    rowCells.push(escapeCSV(cells[i].textContent.trim()));
                }
            }
            return rowCells.join(',');
        }
        return null;
    };

    // 5. Part A: Map Employee Rows
    laborRows.forEach(row => {
        const compiledLine = processRowElements(row);
        if (compiledLine) csvContent.push(compiledLine);
    });

    // 6. GAPPED INJECTION: Append exactly 2 blank rows between employee lists and equipment lists
    if (laborRows.length > 0 && equipRows.length > 0) {
        csvContent.push(`,,,,,,`);
        csvContent.push(`,,,,,,`);
    }

    // 7. Part B: Map Equipment Rows
    equipRows.forEach(row => {
        const compiledLine = processRowElements(row);
        if (compiledLine) csvContent.push(compiledLine);
    });

    // 8. Append Bottom Operational Workspace Task Remarks (Footer Layer)
    csvContent.push(`,,,,,,`); 
    csvContent.push(`"TASK REMARKS / LOGS",,,,,,`);
    csvContent.push(`${escapeCSV(remarks)},,,,,,`);

    // 9. Compile String Stream to File Blob Payload Output
    // const finalCsvString = csvContent.join('\n');
    //const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), finalCsvString], { type: 'text/csv;charset=utf-8;' }); 
    
    // Trigger download sequence step dynamically
    //const link = document.createElement("a");
    //if (link.download !== undefined) {
    //    const url = URL.createObjectURL(blob);
    //    const cleanJobString = jobId.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    //    link.setAttribute("href", url);
    //    link.setAttribute("download", `niemi_timesheet_${cleanJobString}_${inputDate.replace(/\//g, '-')}.csv`);
    //    link.style.visibility = 'hidden';
        
    //    document.body.appendChild(link);
    //    link.click();
    //    document.body.removeChild(link);
    //    URL.revokeObjectURL(url);
    //}

    // 9. Compile String Stream with CRLF line breaks for proper Excel formatting
    const finalCsvString = csvContent.join('\r\n');
    
    // Format parameters clean
    const safeDate = inputDate.replace(/[^a-zA-Z0-9]/g, '-');
    const cleanJobString = jobId.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `niemi_timesheet_${cleanJobString}_${safeDate}.csv`;

    // Detect iOS environment (iPhone, iPad, or Koder framework)
    const isIOSMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOSMobile) {
        // FUNCTION: Creates the visual overlay box so the user can copy raw data if sharing is blocked
        const launchFallbackModal = () => {
            let fallbackContainer = document.getElementById('koder-fallback-modal');
            if (!fallbackContainer) {
                fallbackContainer = document.createElement('div');
                fallbackContainer.id = 'koder-fallback-modal';
                fallbackContainer.style.cssText = 'position:fixed;top:10%;left:5%;width:90%;height:80%;background:#fff;z-index:99999;border:2px solid #333;padding:20px;box-shadow:0 0 15px rgba(0,0,0,0.5);display:flex;flex-direction:column;font-family:sans-serif;box-sizing:border-box;border-radius:8px;';
                document.body.appendChild(fallbackContainer);
            }
            
            fallbackContainer.innerHTML = `
                <h3 style="margin-top:0;color:#333;">iOS Koder CSV Output</h3>
                <p style="font-size:12px;color:#666;margin-bottom:10px;">Your environment blocked the direct file download. Use the button below to copy the data, then paste it directly into Excel or Notes.</p>
                <textarea readonly style="flex:1;width:100%;margin-bottom:15px;padding:10px;font-family:monospace;box-sizing:border-box;font-size:13px;white-space:pre;overflow:auto;" id="koder-csv-text"></textarea>
                <div style="display:flex;gap:10px;">
                    <button id="btn-close-fallback" style="padding:12px 20px;background:#e74c3c;color:#fff;border:none;border-radius:4px;font-weight:bold;cursor:pointer;">Close</button>
                    <button id="btn-select-fallback" style="padding:12px 20px;background:#2ecc71;color:#fff;border:none;border-radius:4px;font-weight:bold;cursor:pointer;">Copy All to Clipboard</button>
                </div>
            `;
            
            const textarea = document.getElementById('koder-csv-text');
            textarea.value = finalCsvString;
            
            document.getElementById('btn-close-fallback').addEventListener('click', () => {
                fallbackContainer.remove();
            });
            
            document.getElementById('btn-select-fallback').addEventListener('click', () => {
                textarea.focus();
                textarea.select();
                textarea.setSelectionRange(0, 99999);
                
                try {
                    navigator.clipboard.writeText(finalCsvString).then(() => {
                        alert('CSV data copied successfully! You can now paste it into Excel.');
                    }).catch(() => {
                        // Old fallback if clipboard API is restricted in Koder
                        document.execCommand('copy');
                        alert('CSV data copied to Clipboard!');
                    });
                } catch(e) {
                    document.execCommand('copy');
                    alert('CSV data copied to Clipboard!');
                }
            });
        };

        // Try utilizing the Native iOS Share Sheet API (Bypasses hidden downloads)
        try {
            const csvBlob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), finalCsvString], { type: 'text/csv' });
            const fileFile = new File([csvBlob], fileName, { type: 'text/csv' });

            if (navigator.canShare && navigator.canShare({ files: [fileFile] })) {
                navigator.share({
                    files: [fileFile],
                    title: 'Niemi Timesheet Export',
                    text: 'Timesheet CSV Data Log'
                }).catch((shareError) => {
                    // User cancelled share sheet or app rejected execution
                    launchFallbackModal();
                });
            } else {
                // Share API not fully supported or restricted by Koder container
                launchFallbackModal();
            }
        } catch (shareInitError) {
            // Context execution environment failure
            launchFallbackModal();
        }

    } else {
        // Desktop Browser Engine Pipeline (Windows, MacOS Safari Standard, Chrome)
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), finalCsvString], { type: 'text/csv;charset=utf-8;' }); 
        
        if (navigator.msSaveBlob) { 
            navigator.msSaveBlob(blob, fileName);
        } else {
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            
            link.href = url;
            link.download = fileName;
            link.style.display = 'none'; 
            
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
        }
    }
}

// ==========================================
// TIMESHEET RESET & CLEANUP LOGIC
// ==========================================
function clearLoggedHoursOnly() {
    // 1. Confirm clear action with user before wiping workspace numbers
    const userConfirmed = confirm("Are you sure you want to clear all logged hours, shift times, and chosen resources from the active workspace?");
    if (!userConfirmed) return;

    // 2. Reset Standard Fixed Form Inputs
    const dateInput = document.getElementById('input-date');
    if (dateInput) dateInput.value = '';

    const jobSelect = document.getElementById('select-job');
    if (jobSelect) jobSelect.value = '';

    const notesTextarea = document.getElementById('input-notes');
    if (notesTextarea) notesTextarea.value = '';

    // 3. Clear and Reset Dynamic Allocation Matrix Inputs
    // Clear numeric hour values inside the matrix grid array cells
    document.querySelectorAll('.hours-input').forEach(input => {
        input.value = '';
    });

    // Reset row summary totals values to baseline display parameters
    document.querySelectorAll('[id^="total-row-"]').forEach(cell => {
        cell.textContent = '0.00';
    });

    // Restore standard default shift times across all rendered time inputs
    document.querySelectorAll('.time-in-input').forEach(input => {
        input.value = '07:00';
    });
    document.querySelectorAll('.time-out-input').forEach(input => {
        input.value = '15:30';
    });

    // 4. Uncheck All Multi-Select Component Checkboxes
    document.querySelectorAll('.multiselect-container input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // 5. Completely Wipe Selections Cache Out of LocalStorage Memory Pools
    localStorage.removeItem(STORAGE_SELECTIONS_KEY);

    // 6. Force Dynamic UI Component Sweeps to Re-draw Clean Closable Tags
    updateClosableTags('multiselect-emp', 'tagsContainerEmp', 'selected-employees');
    updateClosableTags('multiselect-equip', 'tagsContainerEquip', 'selected-equipment');
    updateClosableTags('multiselect-phase', 'tagsContainerPhase', 'selected-phases');

    // 7. Flush Live Tracking Summary Ribbons and Active Meta Display Elements
    const laborBadge = document.getElementById('total-labor-hrs');
    if (laborBadge) laborBadge.textContent = '0.00';

    const equipBadge = document.getElementById('total-equip-hrs');
    if (equipBadge) equipBadge.textContent = '0.00';

    const activeJobBanner = document.getElementById('active-job-banner');
    if (activeJobBanner) {
        activeJobBanner.style.display = 'none';
        document.getElementById('lbl-job-num').textContent = '-';
        document.getElementById('lbl-job-project').textContent = '-';
        document.getElementById('lbl-job-contractor').textContent = '-';
        document.getElementById('lbl-job-owner').textContent = '-';
    }

    // 8. Wipe out the main matrix table arrays completely
    const tableHeader = document.querySelector('#matrix-display-table thead');
    if (tableHeader) tableHeader.innerHTML = '';

    const tableBody = document.getElementById('matrix-table-body');
    if (tableBody) tableBody.innerHTML = '';

    console.log("Workspace entries and selection caching sequences successfully flushed.");
    alert("Timesheet workspace reset successfully!");
}
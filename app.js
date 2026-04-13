// Global Data Store
window.AppData = {
    sessions: [],
    terms: [],
    classesList: [],
    sections: [],
    subjects: []
};

// Application State
const state = {
    currentView: 'home',
    adminData: {
        sessionId: null,
        sessionName: null,
        termId: null,
        termName: null,
        classId: null,
        className: null,
        sectionId: null,
        sectionName: null,
        subjectId: null,
        subjectName: null
    },
    studentSearchData: {
        admissionNumber: null,
        studentName: null,
        sessionId: null,
        sessionName: null,
        termId: null,
        termName: null,
        classId: null,
        className: null,
        sectionId: null,
        sectionName: null,
        results: []
    },
    // Mock extraction data store before saving to main store
    draftResults: []
};

// DOM Elements
const appContainer = document.getElementById('app-container');
const navHomeBtn = document.getElementById('nav-home-btn');
const navLogoutBtn = document.getElementById('nav-logout-btn');
const navLogo = document.getElementById('nav-logo');
const modalOverlay = document.getElementById('modal-container');
const modalCloseBtn = document.getElementById('modal-close');

async function loadInitialData() {
    try {
        const fetchTable = async (tableName) => {
            const { data, error } = await window.supabaseClient.from(tableName).select('*');
            if (error) {
                console.error(`Error fetching ${tableName}:`, error.message);
                return null;
            }
            return data;
        };

        const [sessions, terms, classes, sections, subjects] = await Promise.all([
            fetchTable('sessions'),
            fetchTable('terms'),
            fetchTable('classes'), // changed to 'classes' from 'classesList'
            fetchTable('sections'),
            fetchTable('subjects')
        ]);

        if (sessions) window.AppData.sessions = sessions;
        if (terms) window.AppData.terms = terms;
        if (classes) window.AppData.classesList = classes; // App expects classesList array
        if (sections) window.AppData.sections = sections;
        if (subjects) window.AppData.subjects = subjects;

    } catch (err) {
        console.error('Failed to load initial data:', err);
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    await loadInitialData();
    navHomeBtn.addEventListener('click', () => navigateTo('home'));
    if(navLogoutBtn) {
        navLogoutBtn.addEventListener('click', async () => {
            if(window.supabaseClient) await window.supabaseClient.auth.signOut();
            navigateTo('home');
        });
    }
    navLogo.addEventListener('click', () => navigateTo('home'));
    modalCloseBtn.addEventListener('click', closeModal);
    renderView('home');
    startSlideshow();
});

// Navigation Logic
function navigateTo(viewName, data = {}) {
    state.currentView = viewName;

    if (viewName === 'home') {
        state.adminData = { sessionId: null, sessionName: null, termId: null, termName: null, classId: null, className: null, sectionId: null, sectionName: null, subjectId: null, subjectName: null };
        navHomeBtn.style.display = 'none';
        navHomeBtn.innerHTML = `<i class="fa-solid fa-house"></i> Home`;
        if(navLogoutBtn) navLogoutBtn.style.display = 'none';
    } else {
        navHomeBtn.style.display = 'flex';
        if (['adminSessions', 'adminTerms', 'adminClasses', 'adminSections', 'adminSubjects', 'adminSubjectPreview', 'adminClassPreview'].includes(viewName)) {
            if(navLogoutBtn) navLogoutBtn.style.display = 'flex';
        } else {
            if(navLogoutBtn) navLogoutBtn.style.display = 'none';
        }
    }

    renderView(viewName, data);
}

// Render Switcher
function renderView(viewName, data) {
    appContainer.innerHTML = ''; // Clear container
    let template = '';

    switch (viewName) {
        case 'home':
            template = getHomeTemplate();
            break;
        case 'adminSessions':
            navHomeBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Back to Home`;
            navHomeBtn.onclick = () => navigateTo('home');
            template = getAdminSessionsTemplate();
            break;
        case 'adminTerms':
            navHomeBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Sessions`;
            navHomeBtn.onclick = () => navigateTo('adminSessions');
            template = getAdminTermsTemplate();
            break;
        case 'adminClasses':
            navHomeBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Terms`;
            navHomeBtn.onclick = () => navigateTo('adminTerms');
            template = getAdminClassesTemplate();
            break;
        case 'adminSections':
            navHomeBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Classes`;
            navHomeBtn.onclick = () => navigateTo('adminClasses');
            template = getAdminSectionsTemplate();
            break;
        case 'adminSubjects':
            navHomeBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Sections`;
            navHomeBtn.onclick = () => navigateTo('adminSections');
            template = getAdminSubjectsTemplate();
            break;
        case 'adminExtractLoading':
            // Loading screen while processing
            navHomeBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Cancel`;
            navHomeBtn.onclick = () => navigateTo('adminSubjects');
            template = getLoadingTemplate(data.type);
            break;
        case 'adminSubjectPreview':
            navHomeBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Subjects`;
            navHomeBtn.onclick = () => navigateTo('adminSubjects');
            template = getAdminSubjectPreviewTemplate();
            break;
        case 'adminClassPreview':
            navHomeBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Section`;
            navHomeBtn.onclick = () => navigateTo('adminSections');
            template = getAdminClassPreviewTemplate();
            break;
        // Student Views
        case 'studentSearch':
            navHomeBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Back to Home`;
            navHomeBtn.onclick = () => navigateTo('home');
            template = getStudentSearchTemplate();
            break;
        case 'studentResult':
            navHomeBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Back to Search`;
            navHomeBtn.onclick = () => navigateTo('studentSearch');
            template = getStudentResultTemplate();
            break;
        default:
            template = `<div class="view text-center"><h2>Error: View not found</h2><button class="btn btn-primary" onclick="navigateTo('home')">Go Home</button></div>`;
            break;
    }

    appContainer.innerHTML = template;
    bindEvents(viewName, data);
}

// --- Modals ---
function openModal(title, contentHtml) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = contentHtml;
    modalOverlay.style.display = 'flex';
}

function closeModal() {
    modalOverlay.style.display = 'none';
    if (window.currentCameraStream) {
        window.currentCameraStream.getTracks().forEach(track => track.stop());
        window.currentCameraStream = null;
    }
}

// --- Templates ---

function getHomeTemplate() {
    return `
        <div class="view home-hero">
            <h1>Welcome to Science Secondary School Kafin Hausa</h1>
            <p class="subtitle">Efficient, seamless, and secure school result management system. Please select your role below to continue.</p>
            
            <div class="role-cards">
                <div class="role-card glass-panel" id="btn-admin">
                    <div class="role-icon">
                        <i class="fa-solid fa-user-tie"></i>
                    </div>
                    <div>
                        <h3>Admin Portal</h3>
                        <p>Manage sessions, classes, subjects and upload student results via OCR extraction.</p>
                    </div>
                </div>
                
                <div class="role-card glass-panel" id="btn-student">
                    <div class="role-icon">
                        <i class="fa-solid fa-graduation-cap"></i>
                    </div>
                    <div>
                        <h3>Student Results</h3>
                        <p>Search, preview, and download student academic reports using admission numbers.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getAdminSessionsTemplate() {
    const listHtml = window.AppData.sessions.map(s => `
        <div class="list-item glass-panel" data-id="${s.id}" data-name="${s.name}">
            <div class="list-icon"><i class="fa-regular fa-calendar-days"></i></div>
            <div class="list-content">
                <h4>${s.name}</h4>
                <span>Manage terms and results</span>
            </div>
            <i class="fa-solid fa-chevron-right list-arrow"></i>
        </div>
    `).join('');

    return `
        <div class="view">
            <div class="header-action">
                <div>
                    <h2>Academic Sessions</h2>
                    <p class="text-muted">Select a session or create a new one.</p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" onclick="loadInitialData().then(() => renderView('adminSessions'))"><i class="fa-solid fa-sync"></i> Refresh</button>
                    <button class="btn btn-primary" id="btn-add-session"><i class="fa-solid fa-plus"></i> Add New Session</button>
                </div>
            </div>
            
            <div class="list-container" id="session-list">
                ${listHtml}
            </div>
        </div>
    `;
}

function getAdminTermsTemplate() {
    const listHtml = window.AppData.terms.map(t => `
        <div class="list-item glass-panel" data-id="${t.id}" data-name="${t.name}">
            <div class="list-icon"><i class="fa-solid fa-layer-group"></i></div>
            <div class="list-content">
                <h4>${t.name}</h4>
                <span>Manage classes for this term</span>
            </div>
            <i class="fa-solid fa-chevron-right list-arrow"></i>
        </div>
    `).join('');

    return `
        <div class="view">
            <div class="breadcrumb">
                <span class="nav-link" onclick="navigateTo('adminSessions')">${state.adminData.sessionName}</span>
            </div>
            <div class="header-action">
                <div>
                    <h2>Select Term</h2>
                    <p class="text-muted">Select a term or create a new one.</p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" onclick="loadInitialData().then(() => renderView('adminTerms'))"><i class="fa-solid fa-sync"></i> Refresh</button>
                    <button class="btn btn-primary" id="btn-add-term"><i class="fa-solid fa-plus"></i> Add New Term</button>
                </div>
            </div>
            
            <div class="list-container" id="term-list">
                ${listHtml}
            </div>
        </div>
    `;
}

function getAdminClassesTemplate() {
    const listHtml = window.AppData.classesList.map(c => `
        <div class="list-item glass-panel" data-id="${c.id}" data-name="${c.name}">
            <div class="list-icon"><i class="fa-solid fa-chalkboard-user"></i></div>
            <div class="list-content">
                <h4>${c.name}</h4>
                <span>Manage sections and subjects</span>
            </div>
            <i class="fa-solid fa-chevron-right list-arrow"></i>
        </div>
    `).join('');

    return `
        <div class="view">
            <div class="breadcrumb">
                <span class="nav-link" onclick="navigateTo('adminSessions')">${state.adminData.sessionName}</span>
                <i class="fa-solid fa-chevron-right"></i>
                <span class="nav-link" onclick="navigateTo('adminTerms')">${state.adminData.termName}</span>
            </div>
            
            <div class="header-action">
                <div>
                    <h2>Select Class</h2>
                    <p class="text-muted">Select a class or create a new one.</p>
                </div>
                <button class="btn btn-primary" id="btn-add-class"><i class="fa-solid fa-plus"></i> Add New Class</button>
            </div>
            
            <div class="list-container" id="class-list">
                ${listHtml}
            </div>
        </div>
    `;
}

function getAdminSectionsTemplate() {
    const listHtml = window.AppData.sections.map(s => `
        <div class="list-item glass-panel" data-id="${s.id}" data-name="${s.name}">
            <div class="list-icon"><i class="fa-solid fa-users-rectangle"></i></div>
            <div class="list-content">
                <h4>Section ${s.name}</h4>
                <span>Input and view results</span>
            </div>
            <i class="fa-solid fa-chevron-right list-arrow"></i>
        </div>
    `).join('');

    return `
        <div class="view">
            <div class="breadcrumb">
                <span class="nav-link" onclick="navigateTo('adminSessions')">${state.adminData.sessionName}</span>
                <i class="fa-solid fa-chevron-right"></i>
                <span class="nav-link" onclick="navigateTo('adminTerms')">${state.adminData.termName}</span>
                <i class="fa-solid fa-chevron-right"></i>
                <span class="nav-link" onclick="navigateTo('adminClasses')">${state.adminData.className}</span>
            </div>
            
            <div class="header-action" style="flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h2>Select Section</h2>
                    <p class="text-muted">Choose a section to enter records or view all.</p>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <button class="btn btn-primary" id="btn-add-section"><i class="fa-solid fa-plus"></i> Add Section</button>
                    <button class="btn btn-secondary" id="btn-preview-class"><i class="fa-solid fa-eye"></i> Class Preview</button>
                </div>
            </div>
            
            <div class="list-container grid-list" id="section-list">
                ${listHtml}
            </div>
        </div>
    `;
}

function getAdminSubjectsTemplate() {
    const listHtml = window.AppData.subjects.map(sub => `
        <div class="list-item glass-panel" style="flex-direction: column; align-items: stretch; gap: 1rem;" data-id="${sub.id}" data-name="${sub.name}">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center;">
                    <div class="list-icon"><i class="fa-solid fa-book"></i></div>
                    <div class="list-content">
                        <h4>${sub.name}</h4>
                    </div>
                </div>
            </div>
            <div class="action-buttons">
                <button class="btn btn-secondary" onclick="simulateUpload('${sub.id}', '${sub.name}', 'image')">
                    <i class="fa-solid fa-camera"></i> Scan Camera
                </button>
                <button class="btn btn-secondary" onclick="simulateUpload('${sub.id}', '${sub.name}', 'image-file')">
                    <i class="fa-solid fa-image"></i> Upload Image
                </button>
                <button class="btn btn-secondary" onclick="simulateUpload('${sub.id}', '${sub.name}', 'document')">
                    <i class="fa-solid fa-file-excel"></i> Upload Doc
                </button>
                <button class="btn btn-primary" onclick="previewSubject('${sub.id}', '${sub.name}')">
                    <i class="fa-solid fa-eye"></i> Preview / Edit
                </button>
            </div>
        </div>
    `).join('');

    return `
        <div class="view">
            <div class="breadcrumb">
                <span class="nav-link" onclick="navigateTo('adminSessions')">${state.adminData.sessionName}</span>
                <i class="fa-solid fa-chevron-right"></i>
                <span class="nav-link" onclick="navigateTo('adminTerms')">${state.adminData.termName}</span>
                <i class="fa-solid fa-chevron-right"></i>
                <span class="nav-link" onclick="navigateTo('adminClasses')">${state.adminData.className}</span>
                <i class="fa-solid fa-chevron-right"></i>
                <span class="nav-link" onclick="navigateTo('adminSections')">Section ${state.adminData.sectionName}</span>
            </div>
            
            <div class="header-action" style="flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h2>Subjects</h2>
                    <p class="text-muted">Upload result sheets (images/CSV) or edit pre-existing data.</p>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <button class="btn btn-primary" id="btn-add-subject"><i class="fa-solid fa-plus"></i> Add Subject</button>
                    <button class="btn btn-secondary" id="btn-preview-class-header"><i class="fa-solid fa-users"></i> Section Overview</button>
                </div>
            </div>
            
            <div class="list-container grid-list">
                ${listHtml}
            </div>
        </div>
    `;
}

function getLoadingTemplate(type) {
    const message = type === 'image'
        ? 'Scanning image via OCR and extracting data...'
        : 'Parsing document (CSV/Excel) and importing grades...';

    return `
        <div class="view loader-container glass-panel">
            <div class="spinner"></div>
            <h2>Processing Record</h2>
            <p class="text-muted">${message}</p>
        </div>
    `;
}

function getAdminSubjectPreviewTemplate() {
    // Generate draft rows from state.draftResults
    const rowsHtml = state.draftResults.map((result, idx) => `
        <tr data-idx="${idx}">
            <td><input type="text" class="table-input large" value="${result.adminNumber}" name="adminNumber"></td>
            <td><input type="text" class="table-input large" value="${result.fullName}" name="fullName"></td>
            <td><input type="number" class="table-input" value="${result.scores.ca1 || ''}" name="ca1"></td>
            <td><input type="number" class="table-input" value="${result.scores.ca2 || ''}" name="ca2"></td>
            <td><input type="number" class="table-input" value="${result.scores.ca3 || ''}" name="ca3"></td>
            <td><input type="number" class="table-input" value="${result.scores.exam || ''}" name="exam"></td>
            <td class="total-col">${result.scores.total || 0}</td>
            <td class="grade-col">${result.scores.grade || '-'}</td>
            <td><button class="btn btn-secondary text-muted delete-row"><i class="fa-solid fa-trash"></i></button></td>
        </tr>
    `).join('');

    return `
        <div class="view">
            <div class="breadcrumb">
                <span class="nav-link" onclick="navigateTo('adminSessions')">${state.adminData.sessionName}</span>
                <i class="fa-solid fa-chevron-right"></i>
                <span class="nav-link" onclick="navigateTo('adminTerms')">${state.adminData.termName}</span>
                <i class="fa-solid fa-chevron-right"></i>
                <span class="nav-link" onclick="navigateTo('adminClasses')">${state.adminData.className}</span>
                <i class="fa-solid fa-chevron-right"></i>
                <span class="nav-link" onclick="navigateTo('adminSections')">Section ${state.adminData.sectionName}</span>
                <i class="fa-solid fa-chevron-right"></i>
                <span class="nav-link" onclick="navigateTo('adminSubjects')">${state.adminData.subjectName} Preview</span>
            </div>
            
            <div class="header-action">
                <h2>Extracted Data Preview</h2>
                <div class="action-buttons">
                    <button class="btn btn-secondary" id="btn-add-row"><i class="fa-solid fa-plus"></i> Add Row</button>
                    <button class="btn btn-primary" id="btn-save-subject"><i class="fa-solid fa-check"></i> Save Subject</button>
                </div>
            </div>
            
            <div class="glass-panel" style="padding: 1rem;">
                <div class="table-responsive">
                    <table class="data-table" id="subject-preview-table">
                        <thead>
                            <tr>
                                <th>Admin No</th>
                                <th>Full Name</th>
                                <th>CA 1</th>
                                <th>CA 2</th>
                                <th>CA 3</th>
                                <th>Exam</th>
                                <th>Total</th>
                                <th>Grade</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="9" class="text-center text-muted">No data found. Upload a report sheet first!</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>

            ${state.rawOcrText ? `
            <div class="glass-panel" style="padding: 1.5rem; margin-top: 1.5rem;">
                <h3 style="margin-bottom: 0.5rem; color: #ef4444;"><i class="fa-solid fa-bug"></i> OCR Raw Output Debugger</h3>
                <p class="text-muted" style="margin-bottom: 1rem;">Here is the exact text the AI read from your image. Use this to cross-check the table above and manually add or correct any rows it missed!</p>
                <textarea class="form-control" style="width: 100%; height: 300px; font-family: monospace; white-space: pre-wrap;" readonly>${state.rawOcrText}</textarea>
            </div>
            ` : ''}

        </div>
    `;
}

function getAdminClassPreviewTemplate() {
    const key = `${state.adminData.sessionId}_${state.adminData.termId}_${state.adminData.classId}_${state.adminData.sectionId}`;
    let baseStudents = window.AppData.resultsStore[key] || [];

    // We get all unique subjects that have grades
    const subjectsMap = {};
    window.AppData.subjects.forEach(s => subjectsMap[s.id] = s.name);

    // Setup header
    const subjectIds = window.AppData.subjects.map(s => s.id);
    const thHTML = window.AppData.subjects.map(s => `<th>${s.name.substring(0, 3)}</th>`).join('');

    let allStudents = baseStudents.map(student => {
        let totalScore = 0;
        let subjectCount = 0;
        subjectIds.forEach(subId => {
            const gradeInfo = student.scores[subId];
            if (gradeInfo && typeof gradeInfo.total === 'number') {
                totalScore += gradeInfo.total;
                subjectCount++;
            }
        });
        const averageScore = subjectCount > 0 ? (totalScore / subjectCount) : 0;
        return {
            ...student,
            totalScore: parseFloat(totalScore.toFixed(2)),
            averageScore: parseFloat(averageScore.toFixed(2))
        };
    });

    // Sort by Average Score Ascending
    allStudents.sort((a, b) => a.averageScore - b.averageScore);

    // Assign Position
    let tempSorted = [...allStudents].sort((a, b) => b.averageScore - a.averageScore);
    let positions = {};
    tempSorted.forEach((s, idx) => {
        if (!positions[s.adminNumber]) {
            positions[s.adminNumber] = idx + 1;
        }
    });

    const rowsHtml = allStudents.map(student => {
        const tdHTML = subjectIds.map(subId => {
            const gradeInfo = student.scores[subId];
            if (gradeInfo) return `<td>${gradeInfo.total} (${gradeInfo.grade})</td>`;
            return `<td class="text-muted">-</td>`;
        }).join('');

        const studentPos = positions[student.adminNumber] || '-';

        return `
            <tr>
                <td>${student.adminNumber}</td>
                <td>${student.fullName}</td>
                ${tdHTML}
                <td><strong>${student.totalScore}</strong></td>
                <td><strong>${student.averageScore}</strong></td>
                <td><strong>${studentPos}</strong></td>
            </tr>
        `;
    }).join('');

    return `
        <div class="view">
            <div class="breadcrumb">
                <span class="nav-link" onclick="navigateTo('adminSessions')">${state.adminData.sessionName}</span>
                <i class="fa-solid fa-chevron-right"></i>
                <span class="nav-link" onclick="navigateTo('adminTerms')">${state.adminData.termName}</span>
                <i class="fa-solid fa-chevron-right"></i>
                <span class="nav-link" onclick="navigateTo('adminClasses')">${state.adminData.className}</span>
                <i class="fa-solid fa-chevron-right"></i>
                <span class="nav-link" onclick="navigateTo('adminSections')">Section ${state.adminData.sectionName}</span>
                <i class="fa-solid fa-chevron-right"></i>
                <span>Class Preview</span>
            </div>
            
            <div class="header-action">
                <h2>Class Master Sheet</h2>
            </div>
            
            <div class="glass-panel" style="padding: 1rem;">
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Admin No</th>
                                <th>Full Name</th>
                                ${thHTML}
                                <th>Total</th>
                                <th>Average</th>
                                <th>Position</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="100" class="text-center text-muted">No subjects saved yet.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function getStudentSearchTemplate() {
    const sessionOpts = window.AppData.sessions.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    const termOpts = window.AppData.terms.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    const classOpts = window.AppData.classesList.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const sectionOpts = window.AppData.sections.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    return `
        <div class="view" style="align-items: center;">
            <div style="max-width: 500px; width: 100%;">
                <h2 class="text-center">Search Student Results</h2>
                <p class="subtitle" style="margin-bottom: 2rem;">Fill in the details below to securely access your academic report card.</p>
                
                <div class="glass-panel" style="padding: 2.5rem;">
                    <div class="form-group">
                        <label>Academic Session</label>
                        <select id="search-session" class="form-control">
                            <option value="">-- Select Session --</option>
                            ${sessionOpts}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Term</label>
                        <select id="search-term" class="form-control">
                            <option value="">-- Select Term --</option>
                            ${termOpts}
                        </select>
                    </div>
                    
                    <div class="form-group" style="display: flex; gap: 1rem; flex-direction: row;">
                        <div style="flex:1;">
                            <label style="display:block; margin-bottom: 0.5rem;">Class</label>
                            <select id="search-class" class="form-control" style="width: 100%;">
                                <option value="">Select...</option>
                                ${classOpts}
                            </select>
                        </div>
                        <div style="flex:1;">
                            <label style="display:block; margin-bottom: 0.5rem;">Section</label>
                            <select id="search-section" class="form-control" style="width: 100%;">
                                <option value="">Select...</option>
                                ${sectionOpts}
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Admission Number</label>
                        <input type="text" id="search-admin-no" class="form-control" placeholder="e.g. 11100">
                    </div>
                    
                    <button class="btn btn-primary" style="width: 100%; margin-top: 1rem; padding: 1rem;" id="btn-search-results">
                        <i class="fa-solid fa-magnifying-glass"></i> Search Results
                    </button>
                    <div id="search-error" style="color: #ef4444; margin-top: 1rem; text-align: center; display: none;"></div>
                </div>
            </div>
        </div>
    `;
}

function getStudentResultTemplate() {
    const data = state.studentSearchData;

    let grandTotal = 0;
    let maxScore = data.results.length * 100;

    // We'll calculate totals to show at the bottom
    let totalScore = 0;
    let subjectCount = 0;

    const allSubjects = [
        "English Language.",
        "Mathematics",
        "Biology",
        "Chemistry",
        "Physics",
        "Civic Education",
        "Hausa Language/ T.D",
        "Computer Science.",
        "Geography",
        "Agric. Sci.",
        "Data Processing",
        "Islamic Studies.",
        "Animal Husbandry"
    ];

    // Build Rows
    const rowsHtml = allSubjects.map((subName, index) => {
        // Find if student has this subject
        const subData = data.results.find(r => r.subjectName.toLowerCase() === subName.toLowerCase() || r.subjectName.includes(subName.split(' ')[0]));
        
        let caHtml = '';
        let examHtml = '';
        let totalHtml = '';
        let gradeHtml = '';
        let remarkHtml = '';

        if(subData) {
            let caTotal = (subData.ca1 || 0) + (subData.ca2 || 0) + (subData.ca3 || 0);
            let examScore = subData.exam || 0;
            let subjectTotal = subData.total !== null ? subData.total : (caTotal > 0 || examScore > 0 ? (caTotal + examScore) : 0);
            
            if (subjectTotal > 0) {
                totalScore += subjectTotal;
                subjectCount++;
            }

            caHtml = caTotal > 0 ? caTotal : '';
            examHtml = examScore > 0 ? examScore : '';
            totalHtml = subjectTotal > 0 ? subjectTotal : '';
            gradeHtml = subData.grade || '';
            
            if(subjectTotal >= 70) remarkHtml = 'Excellent';
            else if(subjectTotal >= 60) remarkHtml = 'Very Good';
            else if(subjectTotal >= 50) remarkHtml = 'Good';
            else if(subjectTotal >= 45) remarkHtml = 'Pass';
            else if(subjectTotal >= 40) remarkHtml = 'Fair';
            else if(subjectTotal > 0) remarkHtml = 'Fail';
        }

        // Psychomotor & Behaviour Section Mapping (Right side of the table)
        // Since the right side is static in the mockup, we will map it row by row.
        let rightSideHtml = '';
        if(index === 0) rightSideHtml = `<td colspan="5" style="border: 1px solid #000; padding: 2px 4px; font-weight: bold; font-size: 0.8rem;">PSYCHOMOTOR<br>ASSESSMENT</td>`;
        else if(index === 1) rightSideHtml = `<td colspan="5" style="border: 1px solid #000; padding: 2px 4px; font-size: 0.8rem;">1. Fluency in Spoken English</td>`;
        else if(index === 2) rightSideHtml = `<td colspan="5" style="border: 1px solid #000; padding: 2px 4px; font-size: 0.8rem;">2. Sports</td>`;
        else if(index === 3) rightSideHtml = `<td colspan="5" style="border: 1px solid #000; padding: 2px 4px; font-size: 0.8rem;">3. Drawing & Painting</td>`;
        else if(index === 4) rightSideHtml = `<td colspan="5" style="border: 1px solid #000; padding: 2px 4px; font-size: 0.8rem;">Total</td>`;
        else if(index === 5) rightSideHtml = `<td colspan="5" style="border: 1px solid #000; padding: 2px 4px; font-weight: bold; font-size: 0.8rem; text-align: center; text-decoration: underline;">BEHAVIOUR</td>`;
        else if(index === 6) rightSideHtml = `<td colspan="5" style="border: 1px solid #000; padding: 2px 4px; font-size: 0.8rem;">Neatness</td>`;
        else if(index === 7) rightSideHtml = `<td colspan="5" style="border: 1px solid #000; padding: 2px 4px; font-size: 0.8rem;">Politeness</td>`;
        else if(index === 8) rightSideHtml = `<td colspan="5" style="border: 1px solid #000; padding: 2px 4px; font-size: 0.8rem;">Honesty</td>`;
        else if(index === 9) rightSideHtml = `<td colspan="5" style="border: 1px solid #000; padding: 2px 4px; font-size: 0.8rem;">Relationship with teachers</td>`;
        else if(index === 10) rightSideHtml = `<td colspan="5" style="border: 1px solid #000; padding: 2px 4px; font-size: 0.8rem;">Relationship with students</td>`;
        else if(index === 11) rightSideHtml = `<td colspan="5" style="border: 1px solid #000; padding: 2px 4px; font-size: 0.8rem;">Self control</td>`;
        else if(index === 12) rightSideHtml = `<td colspan="5" style="border: 1px solid #000; padding: 2px 4px; font-size: 0.8rem;">Team work</td>`;
        

        // Checkboxes for right side
        let checksHtml = `
            <td style="border: 1px solid #000; width: 20px;"></td>
            <td style="border: 1px solid #000; width: 20px;"></td>
            <td style="border: 1px solid #000; width: 20px;"></td>
            <td style="border: 1px solid #000; width: 20px;"></td>
            <td style="border: 1px solid #000; width: 20px;"></td>
        `;

        if(index === 0 || index === 5) {
            // Header rows for right side, no checkboxes, but keep structure
             checksHtml = `
                <td style="border: 1px solid #000; width: 20px; background: #f0f0f0;"></td>
                <td style="border: 1px solid #000; width: 20px; background: #f0f0f0;"></td>
                <td style="border: 1px solid #000; width: 20px; background: #f0f0f0;"></td>
                <td style="border: 1px solid #000; width: 20px; background: #f0f0f0;"></td>
                <td style="border: 1px solid #000; width: 20px; background: #f0f0f0;"></td>
            `;
        }

        return `
            <tr>
                <td style="border: 1px solid #000; padding: 4px; font-weight: bold; font-size: 0.9rem;">${subName}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${caHtml}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${examHtml}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${totalHtml}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${gradeHtml}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 0.8rem;">${remarkHtml}</td>
                ${rightSideHtml}
                ${checksHtml}
            </tr>
        `;
    }).join('');

    // Extra rows for right side that go beyond subjects
    const extraRows = `
        <tr>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td colspan="5" style="border: 1px solid #000; padding: 2px 4px; font-size: 0.8rem;">Sense of Responsibilities</td>
            <td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td>
        </tr>
        <tr>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td colspan="5" style="border: 1px solid #000; padding: 2px 4px; font-size: 0.8rem;">Attentiveness</td>
             <td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td>
        </tr>
        <tr>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td colspan="5" style="border: 1px solid #000; padding: 2px 4px; font-size: 0.8rem;">Initiatives</td>
             <td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td>
        </tr>
        <tr>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td colspan="5" style="border: 1px solid #000; padding: 2px 4px; font-size: 0.8rem;">Perseverance</td>
             <td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td>
        </tr>
        <tr>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td colspan="5" style="border: 1px solid #000; padding: 2px 4px; font-size: 0.8rem;">Co-curricular Activities</td>
             <td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td>
        </tr>
         <tr>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td colspan="5" style="border: 1px solid #000; padding: 2px 4px; font-size: 0.8rem;">Total</td>
             <td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td>
        </tr>
         <tr>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td style="border: 1px solid #000; padding: 4px;"></td>
            <td colspan="10" rowspan="6" style="border: 1px solid #000; padding: 2px 4px; font-size: 0.75rem; vertical-align: top;">
                <div style="text-align: center; font-weight: bold; margin-bottom: 5px;">KEY TO RATINGS</div>
                <div style="margin-bottom: 3px;">5. Maintains on degree of observable traits</div>
                <div style="margin-bottom: 15px;">4. Maintains high level of observable traits</div>
                <div style="margin-bottom: 10px;">3. Acceptable level of observable traits</div>
                <div style="margin-bottom: 3px;">2. Shows minimal regard for observable traits</div>
                <div>1. Has no regard for the observable traits</div>
            </td>
        </tr>
        <tr><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td></tr>
        <tr><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td></tr>
        <tr><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td></tr>
        <tr><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td></tr>
        <tr><td style="border: 1px solid #000; padding: 4px;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td><td style="border: 1px solid #000;"></td></tr>
        
        <tr>
            <td style="border: 1px solid #000; padding: 4px; font-size: 0.8rem;">Total Score :</td>
            <td colspan="4" style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 0.8rem;">out of: &nbsp;&nbsp;&nbsp; 900</td>
            <td colspan="11" style="border: 1px solid #000; padding: 4px; font-size: 0.8rem;">Average:</td>
        </tr>
    `;

    let average = subjectCount > 0 ? (totalScore / subjectCount).toFixed(1) : 0;

    return `
        <div class="view" style="align-items: center; padding: 2rem 0;">
            <div class="header-action" style="max-width: 900px; width: 100%; align-items: center; margin-bottom: 1rem;">
                <div></div> <!-- spacing -->
                <button class="btn btn-secondary" onclick="window.print()">
                    <i class="fa-solid fa-print"></i> Print / Download PDF
                </button>
            </div>
            
            <div class="report-card printable-report" style="background: white; color: black; padding: 10px; width: 100%; max-width: 900px; margin: 0 auto; box-sizing: border-box;">
                <div style="border: 4px double #000; padding: 15px; position: relative;"> <!-- Outer decorative border -->
                    
                    <div class="report-header-section" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px;">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Coat_of_arms_of_Nigeria.svg/300px-Coat_of_arms_of_Nigeria.svg.png" alt="Coat of Arms" style="width: 80px; object-fit: contain;">
                        <div style="text-align: center; flex: 1;">
                            <h3 style="margin:0; font-size: 1.1rem; text-transform: uppercase;">SCIENCE AND TECHNICAL EDUCATION BOARD</h3>
                            <p style="margin: 2px 0; font-size: 0.9rem;">JIGAWA STATE, NIGERIA</p>
                            <h2 style="margin: 5px 0; font-size: 1.1rem; font-weight: bold;">SCIENCE SECONDARY SCHOOL KAFIN HAUSA</h2>
                            <h3 style="margin: 10px 0 0 0; font-size: 1.2rem; font-weight: bold; background: #ccc; display: inline-block; padding: 2px 10px;">STUDENT REPORT SHEET</h3>
                        </div>
                        <img src="images/logo.jpg" alt="Logo" style="width: 80px; object-fit: contain;">
                    </div>
                    
                    <div class="student-info-section" style="margin-bottom: 10px; font-size: 0.85rem; font-family: sans-serif; font-weight: 500;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <div style="flex: 1.5; display: flex;">
                                <span style="width: 80px;">NAME:</span> 
                                <span style="font-weight: normal; text-transform: uppercase;">${data.studentName}</span>
                            </div>
                            <div style="flex: 2; display: flex;">
                                <span style="width: 80px;">ADM NO:</span> 
                                <span style="font-weight: normal; text-transform: uppercase;">${data.admissionNumber}</span>
                            </div>
                            <div style="flex: 1;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <div style="flex: 1.5; display: flex;">
                                <span style="width: 80px;">TERM:</span> 
                                <span style="font-weight: normal; text-transform: uppercase;">${data.termName}</span>
                            </div>
                            <div style="flex: 2; display: flex;">
                                <span style="width: 80px;">SESSION:</span> 
                                <span style="font-weight: bold; font-style: italic;">${data.sessionName}</span>
                            </div>
                            <div style="flex: 1; display: flex;">
                                <span style="width: 60px;">CLASS:</span> 
                                <span style="font-weight: normal; text-transform: uppercase;">${data.className} ${data.sectionName}</span>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <div style="flex: 1.5; display: flex;">
                                <span style="width: 80px;">POSITION:</span> 
                                <span></span>
                            </div>
                            <div style="flex: 2; display: flex;">
                                <span style="width: 80px;">OUT OF:</span> 
                                <span></span>
                            </div>
                            <div style="flex: 1; display: flex;">
                                <span style="width: 130px;">NEXT TERM BEGINS:</span> 
                                <span></span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Adjust vertical alignments with rotated text headers -->
                    <style>
                        .vertical-hdr {
                            writing-mode: vertical-rl;
                            transform: rotate(180deg);
                            font-size: 0.65rem;
                            white-space: nowrap;
                            height: 70px;
                            line-height: 1;
                        }
                    </style>
                    <table class="report-table printable-table" style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-family: sans-serif;">
                        <thead>
                            <tr>
                                <th rowspan="2" style="border: 1px solid #000; padding: 6px; text-align: left; vertical-align: bottom;">SUBJECT</th>
                                <th rowspan="2" style="border: 1px solid #000; padding: 2px; text-align: center; width: 30px;"><div class="vertical-hdr">CA/30</div></th>
                                <th rowspan="2" style="border: 1px solid #000; padding: 2px; text-align: center; width: 30px;"><div class="vertical-hdr">EXAM/70</div></th>
                                <th rowspan="2" style="border: 1px solid #000; padding: 2px; text-align: center; width: 30px;"><div class="vertical-hdr">TOTAL / 100</div></th>
                                <th rowspan="2" style="border: 1px solid #000; padding: 2px; text-align: center; width: 30px;"><div class="vertical-hdr">GRADE</div></th>
                                <th rowspan="2" style="border: 1px solid #000; padding: 2px; text-align: center; width: 30px;"><div class="vertical-hdr">REMARK</div></th>
                                <th colspan="5" style="border-right: none;"></th>
                                <th style="border: 1px solid #000; width: 20px; font-size: 0.7rem; text-align: center; font-weight: bold; background: #fff;">5</th>
                                <th style="border: 1px solid #000; width: 20px; font-size: 0.7rem; text-align: center; font-weight: bold; background: #fff;">4</th>
                                <th style="border: 1px solid #000; width: 20px; font-size: 0.7rem; text-align: center; font-weight: bold; background: #fff;">3</th>
                                <th style="border: 1px solid #000; width: 20px; font-size: 0.7rem; text-align: center; font-weight: bold; background: #fff;">2</th>
                                <th style="border: 1px solid #000; width: 20px; font-size: 0.7rem; text-align: center; font-weight: bold; background: #fff;">1</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                            ${extraRows}
                        </tbody>
                    </table>
                    
                    <div style="position: absolute; bottom: 84px; left: 140px; font-weight: bold; font-size: 0.8rem;">${totalScore > 0 ? totalScore : ''}</div>
                    <div style="position: absolute; bottom: 84px; right: 380px; font-weight: bold; font-size: 0.8rem;">${average > 0 ? average : ''}</div>
                    
                    <div class="report-footer-section" style="margin-top: 15px; font-size: 0.85rem; line-height: 2; font-family: sans-serif; font-weight: bold;">
                        <div style="display: flex; justify-content: space-between;">
                            <div style="flex: 1; display: flex;">
                                <span style="white-space: nowrap; margin-right: 10px;">Class Master's Remarks :</span> 
                            </div>
                            <div style="display: flex; margin-right: 50px;">
                                <span style="white-space: nowrap; margin-right: 10px;">Sign:</span> 
                                <span style="border-bottom: 1px solid #000; width: 100px;"></span>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <div style="flex: 1; display: flex;">
                                <span style="white-space: nowrap; margin-right: 10px;">Principal's Remarks:</span> 
                            </div>
                            <div style="display: flex; margin-right: 50px;">
                                <span style="white-space: nowrap; margin-right: 10px;">Sign:</span> 
                                <span style="border-bottom: 1px solid #000; width: 100px;"></span>
                            </div>
                        </div>
                    </div>
                </div> <!-- End outer decorative border -->
            </div>
        </div>
    `;
}

// --- Logic Helpers ---

window.processOCRText = (text) => {
    const drafted = [];
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    
    for (let line of lines) {
        const parts = line.split(/\s+/).filter(Boolean);
        
        // Relaxed heuristics: just need at least one number and one word
        const numbers = parts.map(p => parseFloat(p)).filter(n => !isNaN(n));
        const words = parts.filter(p => isNaN(parseFloat(p)));

        if (numbers.length >= 1 && words.length >= 1) {
            let admin = "";
            let nameParts = [];
            
            words.forEach(w => {
                if (!admin && (w.match(/[0-9]/) || w.toLowerCase().includes('adm'))) { 
                    admin = w;
                } else {
                    if (w.length > 1 || words.length === 1) nameParts.push(w);
                }
            });
            
            let rCA1 = numbers[0] || null;
            let rCA2 = numbers[1] || null;
            let rCA3 = numbers.length > 3 ? numbers[2] : null; 
            let rExam = numbers.length === 2 ? numbers[1] : (numbers.length > 3 ? numbers[3] : (numbers[2] || null));
            
            let total = 0;
            if(rCA1) total += rCA1;
            if(rCA2) total += rCA2;
            if(rCA3) total += rCA3;
            if(rExam) total += rExam;
            
            let grade = '-';
            if (total > 0) {
                if (total >= 70) grade = 'A';
                else if (total >= 60) grade = 'B';
                else if (total >= 50) grade = 'C';
                else if (total >= 45) grade = 'D';
                else if (total >= 40) grade = 'E';
                else grade = 'F';
            }
            
            drafted.push({
                adminNumber: admin || (nameParts[0] ? nameParts[0].toUpperCase() + '-00' : ''),
                fullName: nameParts.join(' '),
                scores: { ca1: rCA1, ca2: rCA2, ca3: rCA3, exam: rExam, total: total, grade: grade }
            });
        }
    }

    if(drafted.length === 0) {
        drafted.push({ adminNumber: '', fullName: '', scores: { ca1: null, ca2: null, ca3: null, exam: null, total: 0, grade: '-' } });
    }
    return { drafted, rawText: text };
};

window.simulateUpload = (subjectId, subjectName, type) => {
    state.adminData.subjectId = subjectId;
    state.adminData.subjectName = subjectName;

    if (type === 'image') {
        openCameraModal(subjectId);
    } else if (type === 'image-file') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            if (e.target.files && e.target.files.length > 0) {
                const file = e.target.files[0];
                navigateTo('adminExtractLoading', { type: 'image' });

                const reader = new FileReader();
                reader.onload = async (evt) => {
                    const imageData = evt.target.result;
                    try {
                        const worker = await window.Tesseract.createWorker('eng');
                        const ret = await worker.recognize(imageData);
                        const text = ret.data.text;
                        await worker.terminate();

                        const { drafted, rawText } = window.processOCRText(text);
                        state.draftResults = drafted;
                        state.rawOcrText = rawText;
                        
                        navigateTo('adminSubjectPreview');
                    } catch (err) {
                        console.error("OCR Error:", err);
                        alert("Error parsing image. Please try again with a clearer picture.");
                        state.draftResults = [];
                        navigateTo('adminSubjectPreview');
                    }
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    } else {
        // Trigger file manager
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel';
        input.onchange = (e) => {
            if (e.target.files && e.target.files.length > 0) {
                const file = e.target.files[0];
                // Navigate to loading
                navigateTo('adminExtractLoading', { type });

                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        const data = evt.target.result;
                        const workbook = window.XLSX.read(data, { type: 'binary' });
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        const jsonRaw = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        
                        const drafted = [];
                        
                        // Expecting header row and data rows.
                        let headerRowIdx = -1;
                        for(let i=0; i<jsonRaw.length; i++) {
                            const rowStr = (jsonRaw[i] || []).join(' ').toLowerCase();
                            if(rowStr.includes('admin') || rowStr.includes('name') || rowStr.includes('ca1') || rowStr.includes('exam')) {
                                headerRowIdx = i;
                                break;
                            }
                        }
                        
                        const startIdx = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
                        
                        for (let i = startIdx; i < jsonRaw.length; i++) {
                            const row = jsonRaw[i];
                            if (!row || row.length === 0) continue;
                            
                            // Trying to heuristically map based on expected columns: [AdminNo, FullName, CA1, CA2, CA3, Exam]
                            const rAdmin = row[0] ? String(row[0]).trim() : '';
                            const rName = row[1] ? String(row[1]).trim() : '';
                            const rCA1 = parseFloat(row[2]) || null;
                            const rCA2 = parseFloat(row[3]) || null;
                            const rCA3 = parseFloat(row[4]) || null;
                            const rExam = parseFloat(row[5]) || null;
                            
                            if (rAdmin || rName) {
                                let total = 0;
                                if(rCA1) total += rCA1;
                                if(rCA2) total += rCA2;
                                if(rCA3) total += rCA3;
                                if(rExam) total += rExam;
                                
                                let grade = '-';
                                if (total > 0) {
                                    if (total >= 70) grade = 'A';
                                    else if (total >= 60) grade = 'B';
                                    else if (total >= 50) grade = 'C';
                                    else if (total >= 45) grade = 'D';
                                    else if (total >= 40) grade = 'E';
                                    else grade = 'F';
                                }

                                drafted.push({
                                    adminNumber: rAdmin,
                                    fullName: rName,
                                    scores: { ca1: rCA1, ca2: rCA2, ca3: rCA3, exam: rExam, total: total, grade: grade }
                                });
                            }
                        }

                        if(drafted.length === 0) {
                            drafted.push({ adminNumber: '', fullName: '', scores: { ca1: null, ca2: null, ca3: null, exam: null, total: 0, grade: '-' } });
                        }

                        state.draftResults = drafted;
                        navigateTo('adminSubjectPreview');
                    } catch (err) {
                        console.error("Extraction error:", err);
                        alert("Error parsing document. Please check the format.");
                        state.draftResults = [];
                        navigateTo('adminSubjectPreview');
                    }
                };
                reader.readAsBinaryString(file);
            }
        };
        input.click();
    }
};

window.openCameraModal = (subjectId) => {
    openModal('Scan Document', `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
            <p class="text-muted" style="text-align: center; margin-bottom: 0;">Position the document clearly within the frame.</p>
            <video id="camera-stream" autoplay playsinline style="width: 100%; max-width: 400px; background: #1e293b; border-radius: 8px; aspect-ratio: 4/3; object-fit: cover; transition: opacity 0.15s ease;"></video>
            <div style="display: flex; gap: 1rem; width: 100%; justify-content: center; margin-top: 1rem;">
                <button class="btn btn-secondary" onclick="closeModal()"><i class="fa-solid fa-xmark"></i> Cancel</button>
                <button class="btn btn-primary" id="btn-capture-image"><i class="fa-solid fa-camera"></i> Capture Image</button>
            </div>
            <p id="camera-error" class="text-muted" style="color: #ef4444; display: none; text-align: center; margin-top: 1rem;"></p>
        </div>
    `);

    const video = document.getElementById('camera-stream');
    const captureBtn = document.getElementById('btn-capture-image');
    const errorMsg = document.getElementById('camera-error');

    // Start Camera using modern WebRTC standards
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(function (stream) {
                video.srcObject = stream;
                window.currentCameraStream = stream; // Keep reference to stop it lazily on close
            })
            .catch(function (error) {
                console.error("Camera error:", error);
                errorMsg.textContent = "Unable to access camera. Please ensure permissions are granted.";
                errorMsg.style.display = 'block';
                captureBtn.disabled = true;
            });
    } else {
        errorMsg.textContent = "Camera API not supported in this browser.";
        errorMsg.style.display = 'block';
        captureBtn.disabled = true;
    }

    captureBtn.onclick = async () => {
        // Flash animation effect
        video.style.opacity = '0.3';
        setTimeout(() => video.style.opacity = '1', 150);

        try {
            // Capture canvas
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL('image/jpeg');

            closeModal();
            navigateTo('adminExtractLoading', { type: 'image' });

            const worker = await window.Tesseract.createWorker('eng');
            const ret = await worker.recognize(imageData);
            const text = ret.data.text;
            await worker.terminate();

            const { drafted, rawText } = window.processOCRText(text);
            state.draftResults = drafted;
            state.rawOcrText = rawText;
            
            navigateTo('adminSubjectPreview');
        } catch (err) {
            console.error("OCR Error:", err);
            alert("Error parsing image. Please try again with a clearer picture.");
            state.draftResults = [];
            navigateTo('adminSubjectPreview');
        }
    };
};

window.previewSubject = async (subjectId, subjectName) => {
    state.adminData.subjectId = subjectId;
    state.adminData.subjectName = subjectName;
    state.rawOcrText = null;

    // Show loading
    navigateTo('adminExtractLoading', { type: 'document' });

    try {
        const { data, error } = await window.supabaseClient
            .from('student_results')
            .select('*, students(admission_number, full_name)')
            .eq('session_id', state.adminData.sessionId)
            .eq('term_id', state.adminData.termId)
            .eq('class_id', state.adminData.classId)
            .eq('section_id', state.adminData.sectionId)
            .eq('subject_id', state.adminData.subjectId);

        if (error) throw error;

        if (data && data.length > 0) {
            state.draftResults = data.map(r => ({
                resultId: r.id,
                adminNumber: r.students?.admission_number || '',
                fullName: r.students?.full_name || '',
                scores: {
                    ca1: r.ca1 !== null ? Number(r.ca1) : null,
                    ca2: r.ca2 !== null ? Number(r.ca2) : null,
                    ca3: r.ca3 !== null ? Number(r.ca3) : null,
                    exam: r.exam !== null ? Number(r.exam) : null,
                    total: r.total !== null ? Number(r.total) : 0,
                    grade: r.grade || '-'
                }
            }));
            
            // Sort conceptually by Admission Number for nicer preview
            state.draftResults.sort((a,b) => a.adminNumber.localeCompare(b.adminNumber));
        } else {
            state.draftResults = [];
        }
    } catch (err) {
        console.error("Error fetching subject data:", err);
        alert("Could not load existing subject data.");
        state.draftResults = [];
    }

    navigateTo('adminSubjectPreview');
}

// --- Event Binding ---

function bindEvents(viewName) {
    if (viewName === 'home') {
        document.getElementById('btn-admin').addEventListener('click', async () => {
            // Check if already authenticated
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session) {
                navigateTo('adminSessions');
                return;
            }

            openModal('Admin Login', `
                <div class="form-group">
                    <label>Admin Email</label>
                    <input type="email" id="admin-login-email" class="form-control" placeholder="admin@school.com">
                </div>
                <div class="form-group">
                    <label>Admin Password</label>
                    <input type="password" id="admin-login-password" class="form-control" placeholder="Enter Admin Password">
                </div>
                <p id="admin-login-error" class="text-muted" style="color: #ef4444; display: none; margin-top: -0.5rem; margin-bottom: 0.5rem;">Incorrect Email or Password.</p>
                <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem;">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" id="btn-admin-login-submit">Login</button>
                </div>
            `);
            setTimeout(() => {
                document.getElementById('btn-admin-login-submit').addEventListener('click', async () => {
                    const email = document.getElementById('admin-login-email').value.trim();
                    const pwd = document.getElementById('admin-login-password').value;
                    const errorMsg = document.getElementById('admin-login-error');
                    const btn = document.getElementById('btn-admin-login-submit');

                    if (!email || !pwd) {
                        errorMsg.textContent = "Please enter both email and password.";
                        errorMsg.style.display = 'block';
                        return;
                    }

                    btn.disabled = true;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
                    errorMsg.style.display = 'none';

                    try {
                        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                            email: email,
                            password: pwd,
                        });

                        if (error) throw error;

                        if (data.session) {
                            closeModal();
                            navigateTo('adminSessions');
                        }
                    } catch (err) {
                        console.error('Login error:', err.message);
                        errorMsg.textContent = err.message || "Incorrect Email or Password.";
                        errorMsg.style.display = 'block';
                    } finally {
                        if (btn) {
                            btn.disabled = false;
                            btn.innerHTML = 'Login';
                        }
                    }
                });
            }, 100);
        });
        document.getElementById('btn-student').addEventListener('click', () => {
            navigateTo('studentSearch');
        });
    }

    if (viewName === 'adminSessions') {
        document.getElementById('session-list').addEventListener('click', (e) => {
            const item = e.target.closest('.list-item');
            if (item) {
                state.adminData.sessionId = item.dataset.id || 'Unknown ID';
                state.adminData.sessionName = item.dataset.name || item.querySelector('h4')?.textContent || 'Session';
                navigateTo('adminTerms');
            }
        });

        document.getElementById('btn-add-session').addEventListener('click', () => {
            openModal('Add New Session', `
                <div class="form-group">
                    <label>Session Name (e.g. 2025/2026 Academic session)</label>
                    <input type="text" id="new-session-name" class="form-control" placeholder="Enter session name">
                </div>
                <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem;">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" id="save-new-session">Create Session</button>
                </div>
            `);

            setTimeout(() => {
                document.getElementById('save-new-session').addEventListener('click', async () => {
                    const name = document.getElementById('new-session-name').value.trim();
                    const btn = document.getElementById('save-new-session');

                    if (name) {
                        btn.disabled = true;
                        btn.innerHTML = 'Creating...';
                        try {
                            const { data, error } = await window.supabaseClient.from('sessions').insert([{ name }]).select();
                            if (error) throw error;
                            const newObj = data[0];
                            window.AppData.sessions.push(newObj);
                            closeModal();
                            state.adminData.sessionId = newObj.id;
                            state.adminData.sessionName = newObj.name;
                            navigateTo('adminTerms');
                        } catch (err) {
                            console.error(err);
                            alert("Failed to create session.");
                            btn.disabled = false;
                            btn.innerHTML = 'Create Session';
                        }
                    }
                });
            }, 100);
        });
    }

    if (viewName === 'adminTerms') {
        document.getElementById('term-list').addEventListener('click', (e) => {
            const item = e.target.closest('.list-item');
            if (item) {
                state.adminData.termId = item.dataset.id || 'Unknown ID';
                state.adminData.termName = item.dataset.name || item.querySelector('h4')?.textContent || 'Term';
                navigateTo('adminClasses');
            }
        });

        document.getElementById('btn-add-term')?.addEventListener('click', () => {
            openModal('Add New Term', `
                <div class="form-group">
                    <label>Term Name (e.g. First Term)</label>
                    <input type="text" id="new-term-name" class="form-control" placeholder="Enter term name">
                </div>
                <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem;">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" id="save-new-term">Create Term</button>
                </div>
            `);

            setTimeout(() => {
                document.getElementById('save-new-term').addEventListener('click', async () => {
                    const name = document.getElementById('new-term-name').value.trim();
                    const btn = document.getElementById('save-new-term');

                    if (name) {
                        btn.disabled = true;
                        btn.innerHTML = 'Creating...';
                        try {
                            const { data, error } = await window.supabaseClient.from('terms').insert([{ name }]).select();
                            if (error) throw error;
                            const newObj = data[0];
                            window.AppData.terms.push(newObj);
                            closeModal();
                            state.adminData.termId = newObj.id;
                            state.adminData.termName = newObj.name;
                            navigateTo('adminClasses');
                        } catch (err) {
                            console.error(err);
                            alert("Failed to create term.");
                            btn.disabled = false;
                            btn.innerHTML = 'Create Term';
                        }
                    }
                });
            }, 100);
        });
    }

    if (viewName === 'adminClasses') {
        document.getElementById('class-list').addEventListener('click', (e) => {
            const item = e.target.closest('.list-item');
            if (item) {
                state.adminData.classId = item.dataset.id || 'Unknown ID';
                state.adminData.className = item.dataset.name || item.querySelector('h4')?.textContent || 'Class';
                navigateTo('adminSections');
            }
        });

        document.getElementById('btn-add-class')?.addEventListener('click', () => {
            openModal('Add New Class', `
                <div class="form-group">
                    <label>Class Name (e.g. SS 3)</label>
                    <input type="text" id="new-class-name" class="form-control" placeholder="Enter class name">
                </div>
                <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem;">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" id="save-new-class">Create Class</button>
                </div>
            `);

            setTimeout(() => {
                document.getElementById('save-new-class').addEventListener('click', async () => {
                    const name = document.getElementById('new-class-name').value.trim();
                    const btn = document.getElementById('save-new-class');

                    if (name) {
                        btn.disabled = true;
                        btn.innerHTML = 'Creating...';
                        try {
                            const { data, error } = await window.supabaseClient.from('classes').insert([{ name }]).select();
                            if (error) throw error;
                            const newObj = data[0];
                            window.AppData.classesList.push(newObj);
                            closeModal();
                            state.adminData.classId = newObj.id;
                            state.adminData.className = newObj.name;
                            navigateTo('adminSections');
                        } catch (err) {
                            console.error(err);
                            alert("Failed to create class.");
                            btn.disabled = false;
                            btn.innerHTML = 'Create Class';
                        }
                    }
                });
            }, 100);
        });
    }

    if (viewName === 'adminSections') {
        document.getElementById('section-list').addEventListener('click', (e) => {
            const item = e.target.closest('.list-item');
            if (item) {
                state.adminData.sectionId = item.dataset.id || 'Unknown ID';
                state.adminData.sectionName = item.dataset.name || item.querySelector('h4')?.textContent?.replace('Section ', '') || 'Section';
                navigateTo('adminSubjects');
            }
        });

        document.getElementById('btn-preview-class').addEventListener('click', () => {
            navigateTo('adminClassPreview');
        });

        document.getElementById('btn-add-section')?.addEventListener('click', () => {
            openModal('Add New Section', `
                <div class="form-group">
                    <label>Section Name (e.g. A, B, Science)</label>
                    <input type="text" id="new-section-name" class="form-control" placeholder="Enter section name">
                </div>
                <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem;">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" id="save-new-section">Create Section</button>
                </div>
            `);

            setTimeout(() => {
                document.getElementById('save-new-section').addEventListener('click', async () => {
                    const name = document.getElementById('new-section-name').value.trim();
                    const btn = document.getElementById('save-new-section');

                    if (name) {
                        btn.disabled = true;
                        btn.innerHTML = 'Creating...';
                        try {
                            const { data, error } = await window.supabaseClient.from('sections').insert([{ name }]).select();
                            if (error) throw error;
                            const newObj = data[0];
                            window.AppData.sections.push(newObj);
                            closeModal();
                            navigateTo('adminSections'); // re-render to see the new section
                        } catch (err) {
                            console.error(err);
                            alert("Failed to create section.");
                            btn.disabled = false;
                            btn.innerHTML = 'Create Section';
                        }
                    }
                });
            }, 100);
        });
    }

    if (viewName === 'adminSubjects') {
        document.getElementById('btn-preview-class-header').addEventListener('click', () => {
            navigateTo('adminClassPreview');
        });

        document.getElementById('btn-add-subject')?.addEventListener('click', () => {
            openModal('Add New Subject', `
                <div class="form-group">
                    <label>Subject Name (e.g. Geography)</label>
                    <input type="text" id="new-subject-name" class="form-control" placeholder="Enter subject name">
                </div>
                <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem;">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" id="save-new-subject">Create Subject</button>
                </div>
            `);

            setTimeout(() => {
                document.getElementById('save-new-subject').addEventListener('click', async () => {
                    const name = document.getElementById('new-subject-name').value.trim();
                    const btn = document.getElementById('save-new-subject');

                    if (name) {
                        btn.disabled = true;
                        btn.innerHTML = 'Creating...';
                        try {
                            const { data, error } = await window.supabaseClient.from('subjects').insert([{ name }]).select();
                            if (error) throw error;
                            const newObj = data[0];
                            window.AppData.subjects.push(newObj);
                            closeModal();
                            navigateTo('adminSubjects'); // re-render to see the new subject
                        } catch (err) {
                            console.error(err);
                            alert("Failed to create subject.");
                            btn.disabled = false;
                            btn.innerHTML = 'Create Subject';
                        }
                    }
                });
            }, 100);
        });
    }

    if (viewName === 'adminSubjectPreview') {
        // Bind live updates and calculations when an admin types into the Subject preview rows
        const table = document.getElementById('subject-preview-table');
        if (table) {
            table.addEventListener('input', (e) => {
                if (e.target.classList.contains('table-input')) {
                    const row = e.target.closest('tr');
                    const inputs = row.querySelectorAll('.table-input');
                    let total = 0;
                    [2, 3, 4, 5].forEach(i => {
                        let val = parseFloat(inputs[i].value);
                        if (!isNaN(val)) total += val;
                    });
                    
                    let grade = '-';
                    if (total > 0) {
                        if (total >= 70) grade = 'A';
                        else if (total >= 60) grade = 'B';
                        else if (total >= 50) grade = 'C';
                        else if (total >= 45) grade = 'D';
                        else if (total >= 40) grade = 'E';
                        else grade = 'F';
                    }

                    row.querySelector('.total-col').textContent = total;
                    row.querySelector('.grade-col').textContent = grade;

                    const idx = row.dataset.idx;
                    if (state.draftResults[idx]) {
                        state.draftResults[idx].adminNumber = inputs[0].value;
                        state.draftResults[idx].fullName = inputs[1].value;
                        state.draftResults[idx].scores = {
                            ca1: parseFloat(inputs[2].value) || null,
                            ca2: parseFloat(inputs[3].value) || null,
                            ca3: parseFloat(inputs[4].value) || null,
                            exam: parseFloat(inputs[5].value) || null,
                            total,
                            grade
                        };
                    }
                }
            });

            table.addEventListener('click', async (e) => {
                const btn = e.target.closest('.delete-row');
                if (btn) {
                    const tr = btn.closest('tr');
                    const idx = tr.dataset.idx;
                    const draft = state.draftResults[idx];

                    if (draft.resultId) {
                        if (confirm(`Are you sure you want to permanently delete this record for ${draft.adminNumber}?`)) {
                            const originalHtml = btn.innerHTML;
                            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                            btn.disabled = true;

                            try {
                                const { error } = await window.supabaseClient.from('student_results').delete().eq('id', draft.resultId);
                                if (error) throw error;
                                
                                state.draftResults.splice(idx, 1);
                                navigateTo('adminSubjectPreview');
                            } catch (err) {
                                console.error("Error deleting:", err);
                                alert("Failed to delete record from database.");
                                btn.innerHTML = originalHtml;
                                btn.disabled = false;
                            }
                        }
                    } else {
                        // Not in DB yet, just remove from UI
                        state.draftResults.splice(idx, 1);
                        navigateTo('adminSubjectPreview');
                    }
                }
            });
        }

        document.getElementById('btn-add-row').addEventListener('click', () => {
            state.draftResults.push({
                adminNumber: '',
                fullName: '',
                scores: { ca1: null, ca2: null, ca3: null, exam: null, total: 0, grade: '-' }
            });
            navigateTo('adminSubjectPreview'); // Re-render
        });

        document.getElementById('btn-save-subject').addEventListener('click', async () => {
            const btn = document.getElementById('btn-save-subject');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
            btn.disabled = true;

            try {
                let errors = [];
                for (let i = 0; i < state.draftResults.length; i++) {
                    const draft = state.draftResults[i];
                    
                    if (!draft.adminNumber) {
                        if (draft.scores.total > 0) errors.push(`Row ${i+1}: Missing Admission Number.`);
                        continue;
                    }
                    if (draft.scores.total === '' || draft.scores.total === null) continue;

                    let studentId = null;
                    const { data: students } = await window.supabaseClient
                        .from('students')
                        .select('id')
                        .eq('admission_number', draft.adminNumber);

                    if (students && students.length > 0) {
                        studentId = students[0].id;
                    } else {
                        const { data: newStu, error: stuErr } = await window.supabaseClient
                            .from('students')
                            .insert([{ admission_number: draft.adminNumber, full_name: draft.fullName || 'Unknown Student' }])
                            .select('id');
                            
                        if (stuErr) {
                            errors.push(`Student ${draft.adminNumber}: ${stuErr.message}`);
                            continue;
                        }
                        if (newStu && newStu.length > 0) studentId = newStu[0].id;
                    }

                    if (!studentId) {
                         errors.push(`Student ${draft.adminNumber}: Could not retrieve ID.`);
                         continue;
                    }

                    const { data: existingResults } = await window.supabaseClient
                        .from('student_results')
                        .select('id')
                        .eq('student_id', studentId)
                        .eq('session_id', state.adminData.sessionId)
                        .eq('term_id', state.adminData.termId)
                        .eq('class_id', state.adminData.classId)
                        .eq('section_id', state.adminData.sectionId)
                        .eq('subject_id', state.adminData.subjectId);

                    const payload = {
                        student_id: studentId,
                        session_id: state.adminData.sessionId,
                        term_id: state.adminData.termId,
                        class_id: state.adminData.classId,
                        section_id: state.adminData.sectionId,
                        subject_id: state.adminData.subjectId,
                        ca1: draft.scores.ca1?.toString() || null,
                        ca2: draft.scores.ca2 || null,
                        ca3: draft.scores.ca3 || null,
                        exam: draft.scores.exam || null,
                        total: draft.scores.total || null,
                        grade: draft.scores.grade || null
                    };

                    if (existingResults && existingResults.length > 0) {
                        const { error: updErr } = await window.supabaseClient.from('student_results').update(payload).eq('id', existingResults[0].id);
                        if (updErr) errors.push(`Result ${draft.adminNumber}: ${updErr.message}`);
                    } else {
                        const { error: insErr } = await window.supabaseClient.from('student_results').insert([payload]);
                        if (insErr) errors.push(`Result ${draft.adminNumber}: ${insErr.message}`);
                    }
                }

                if (errors.length > 0) {
                    alert("Some rows failed to save:\\n" + errors.join('\\n'));
                } else {
                    openModal('Success', `
                        <div class="text-center">
                            <i class="fa-solid fa-circle-check text-green-500" style="font-size: 3rem; color: #10b981; margin-bottom: 1rem;"></i>
                            <p>Subject data saved to database successfully!</p>
                        </div>
                    `);
                    setTimeout(() => {
                        closeModal();
                        navigateTo('adminSubjects');
                    }, 1500);
                }

            } catch (err) {
                console.error("Error saving subject", err);
                alert("An unexpected error occurred while saving the data.");
            }

            btn.innerHTML = originalText;
            btn.disabled = false;
        });
    }

    if (viewName === 'studentSearch') {
        document.getElementById('btn-search-results').addEventListener('click', async () => {
            const sid = document.getElementById('search-session').value;
            const tid = document.getElementById('search-term').value;
            const cid = document.getElementById('search-class').value;
            const secid = document.getElementById('search-section').value;
            const adminNo = document.getElementById('search-admin-no').value;
            const errDiv = document.getElementById('search-error');
            const btn = document.getElementById('btn-search-results');

            if (!sid || !tid || !cid || !secid || !adminNo) {
                errDiv.textContent = 'Please fill out all fields.';
                errDiv.style.display = 'block';
                return;
            }

            errDiv.style.display = 'none';
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Searching...';
            btn.disabled = true;

            try {
                // 1. Find the student by admission number
                const { data: students, error: stuErr } = await window.supabaseClient
                    .from('students')
                    .select('*')
                    .eq('admission_number', adminNo);

                if (stuErr || !students || students.length === 0) {
                    errDiv.textContent = 'No student found with this admission number.';
                    errDiv.style.display = 'block';
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    return;
                }

                const student = students[0];

                // 2. Fetch their results for this session/term/class/section
                const { data: results, error: resErr } = await window.supabaseClient
                    .from('student_results')
                    .select('*')
                    .eq('student_id', student.id)
                    .eq('session_id', sid)
                    .eq('term_id', tid)
                    .eq('class_id', cid)
                    .eq('section_id', secid);

                if (resErr || !results || results.length === 0) {
                    errDiv.textContent = 'No result found for this student in the selected class/term.';
                    errDiv.style.display = 'block';
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    return;
                }

                // 3. Map to view model
                const subMap = {};
                window.AppData.subjects.forEach(s => subMap[s.id] = s.name);

                const finalResults = results.map(r => ({
                    subjectName: subMap[r.subject_id] || 'Unknown Subject',
                    ca1: r.ca1 !== null ? Number(r.ca1) : null,
                    ca2: r.ca2 !== null ? Number(r.ca2) : null,
                    ca3: r.ca3 !== null ? Number(r.ca3) : null,
                    exam: r.exam !== null ? Number(r.exam) : null,
                    total: r.total !== null ? Number(r.total) : null,
                    grade: r.grade || '-'
                }));

                // Populate state
                state.studentSearchData = {
                    admissionNumber: student.admission_number,
                    studentName: student.full_name,
                    sessionId: sid,
                    sessionName: window.AppData.sessions.find(s => s.id === sid)?.name || '',
                    termId: tid,
                    termName: window.AppData.terms.find(s => s.id === tid)?.name || '',
                    classId: cid,
                    className: window.AppData.classesList.find(s => s.id === cid)?.name || '',
                    sectionId: secid,
                    sectionName: window.AppData.sections.find(s => s.id === secid)?.name || '',
                    results: finalResults
                };

                navigateTo('studentResult');
            } catch (error) {
                console.error('Search error:', error);
                errDiv.textContent = 'An error occurred during search. Please try again.';
                errDiv.style.display = 'block';
            }

            btn.innerHTML = originalText;
            btn.disabled = false;
        });
    }
}

// --- Slideshow Logic ---
async function startSlideshow() {
    // List of potential background images since client-side JS cannot natively read a directory without a backend
    const possibleImages = [
        'bg-1-new.jpeg', 'bg-2-new.jpeg', 'bg-3-new.jpeg',
        'bg-4-new.jpeg', 'bg-5-new.jpeg', 'bg-6-new.jpeg',
        'bg-7-new.jpeg'
    ];

    const slideshowContainer = document.getElementById('slideshow-container');
    const overlay = document.querySelector('.slideshow-overlay');
    let loadedImages = 0;

    for (const imgName of possibleImages) {
        const imgPath = `images/${imgName}`;
        try {
            // Check if image exists
            const response = await fetch(imgPath, { method: 'HEAD' });
            if (response.ok) {
                const slideDiv = document.createElement('div');
                slideDiv.className = `slide`;
                if(loadedImages === 0) slideDiv.classList.add('active'); // Make first image active
                slideDiv.style.backgroundImage = `url('${imgPath}')`;
                
                // Insert before the overlay
                slideshowContainer.insertBefore(slideDiv, overlay);
                loadedImages++;
            }
        } catch (error) {
            // Ignore missing images
        }
    }

    if(loadedImages === 0) return; // No images found

    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    
    // Safety check just in case
    if(slides.length === 0) return;
    
    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 5000); // Change image every 5 seconds
}

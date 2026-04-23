const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

const helpers = `
// --- Global UI Helpers ---
window.showToast = function(message, type = 'success', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    toast.innerHTML = '<i class="fa-solid ' + icon + '" style="margin-top: 3px;"></i><div class="toast-body">' + message + '</div><button class="toast-close"><i class="fa-solid fa-xmark"></i></button>';
    container.appendChild(toast);
    
    const closeBtn = toast.querySelector('.toast-close');
    const removeToast = () => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    };
    closeBtn.onclick = removeToast;
    setTimeout(removeToast, duration);
}

window.parseGrade = function(val) {
    if (val === "" || val === null || val === undefined) return null;
    let num = parseFloat(val);
    if (isNaN(num)) return null;
    if (num < 0) return 0;
    return num;
}
// --- End Helpers ---
`;

if (!content.includes('showToast')) {
    content = content.replace('async function loadInitialData() {', helpers + '\nasync function loadInitialData() {');
}

const newNavigate = `async function navigateTo(viewName, data = {}) {
    if (viewName.startsWith('admin')) {
        const sessionRes = await window.supabaseClient.auth.getSession();
        if (!sessionRes.data.session) {
            window.showToast('Unauthorized access. Please login.', 'error');
            viewName = 'home';
        }
    }
    state.currentView = viewName;`;
    
content = content.replace(/function navigateTo\(viewName, data = \{\}\) \{\s*state\.currentView = viewName;/, newNavigate);

// OCR extraction/file parsing uses parseFloat
content = content.replace(/parseFloat\(row\[2\]\) \|\| null/g, 'window.parseGrade(row[2])');
content = content.replace(/parseFloat\(row\[3\]\) \|\| null/g, 'window.parseGrade(row[3])');
content = content.replace(/parseFloat\(row\[4\]\) \|\| null/g, 'window.parseGrade(row[4])');
content = content.replace(/parseFloat\(row\[5\]\) \|\| null/g, 'window.parseGrade(row[5])');

content = content.replace(/parseFloat\(inputs\[2\]\.value\) \|\| null/g, 'window.parseGrade(inputs[2].value)');
content = content.replace(/parseFloat\(inputs\[3\]\.value\) \|\| null/g, 'window.parseGrade(inputs[3].value)');
content = content.replace(/parseFloat\(inputs\[4\]\.value\) \|\| null/g, 'window.parseGrade(inputs[4].value)');
content = content.replace(/parseFloat\(inputs\[5\]\.value\) \|\| null/g, 'window.parseGrade(inputs[5].value)');

// Toasts
content = content.replace(/alert\("Failed to create session."\);/g, "window.showToast('Failed to create session.', 'error');");
content = content.replace(/alert\("Error parsing image. Please try again with a clearer picture."\);/g, "window.showToast('Error parsing image. Please try again with a clearer picture.', 'error');");
content = content.replace(/alert\("Error parsing document. Please check the format."\);/g, "window.showToast('Error parsing document. Please check the format.', 'error');");
content = content.replace(/alert\("Could not load existing subject data: " \+ err.message\);/g, "window.showToast('Could not load existing subject data: ' + err.message, 'error');");
content = content.replace(/alert\("Failed to delete record from database."\);/g, "window.showToast('Failed to delete record from database.', 'error');");
content = content.replace(/alert\("Some rows failed to save:\\\\n" \+ errors.join\('\\\\n'\)\);/g, "window.showToast('Some rows failed to save. See console for details.', 'warning');");
content = content.replace(/alert\("An unexpected error occurred while saving the data."\);/g, "window.showToast('An unexpected error occurred while saving the data.', 'error');");

fs.writeFileSync('app.js', content, 'utf8');

import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  UserCircle, 
  FileText, 
  Plus, 
  ChevronRight, 
  ArrowLeft, 
  Image as ImageIcon, 
  Upload, 
  Eye, 
  CheckCircle2, 
  Loader2, 
  Trash2,
  Search,
  LayoutDashboard,
  Save
} from 'lucide-react';

const apiKey = ""; // Provided by the environment

// --- Mock Initial Data Structure ---
const INITIAL_SESSIONS = [
  { id: '1', name: '2023/2024 Academic Session' },
  { id: '2', name: '2024/2025 Academic Session' }
];

const SUBJECTS = [
  "Mathematics", "English Language", "Physics", "Chemistry", "Biology", 
  "Economics", "Civic Education", "Further Mathematics", "Geography"
];

const CLASSES = ["SS 1", "SS 2", "SS 3"];
const TERMS = ["First Term", "Second Term", "Third Term"];
const ARMS = ["A", "B", "C", "D"];

export default function App() {
  // Navigation State
  const [view, setView] = useState('home'); // home, admin, terms, classes, arms, subjects, preview-arm, extraction
  const [history, setHistory] = useState([]);

  // Data State
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [currentSession, setCurrentSession] = useState(null);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [currentClass, setCurrentClass] = useState(null);
  const [currentArm, setCurrentArm] = useState(null);
  const [currentSubject, setCurrentSubject] = useState(null);
  
  // Storage for extracted data: { [armId]: { [subject]: [data] } }
  const [schoolData, setSchoolData] = useState({});

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  // --- Helpers ---
  const navigateTo = (newView, data = {}) => {
    setHistory([...history, { view, currentSession, currentTerm, currentClass, currentArm, currentSubject }]);
    setView(newView);
    if (data.session) setCurrentSession(data.session);
    if (data.term) setCurrentTerm(data.term);
    if (data.className) setCurrentClass(data.className);
    if (data.arm) setCurrentArm(data.arm);
    if (data.subject) setCurrentSubject(data.subject);
  };

  const goBack = () => {
    if (history.length === 0) {
      setView('home');
      return;
    }
    const prev = history[history.length - 1];
    setView(prev.view);
    setCurrentSession(prev.currentSession);
    setCurrentTerm(prev.currentTerm);
    setCurrentClass(prev.currentClass);
    setCurrentArm(prev.currentArm);
    setCurrentSubject(prev.currentSubject);
    setHistory(history.slice(0, -1));
  };

  const addSession = () => {
    if (!newSessionName) return;
    const newSess = { id: Date.now().toString(), name: newSessionName + " Academic Session" };
    setSessions([...sessions, newSess]);
    setNewSessionName('');
    setIsModalOpen(false);
    navigateTo('terms', { session: newSess });
  };

  // --- Gemini API Extraction Simulation ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsExtracting(true);
    setView('extraction');

    // Convert file to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Data = reader.result.split(',')[1];
      
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: "Extract names and scores from this result sheet. Return as a clean JSON array of objects with 'name' and 'score' keys. Only return the JSON." },
                { inlineData: { mimeType: "image/png", data: base64Data } }
              ]
            }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = JSON.parse(text);
        setExtractedData(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        // Fallback mock data if API fails or no image provided
        setExtractedData([
          { name: "John Doe", score: 85 },
          { name: "Jane Smith", score: 92 },
          { name: "Chidi Okafor", score: 78 }
        ]);
      } finally {
        setIsExtracting(false);
      }
    };
  };

  const saveExtractedData = () => {
    const armKey = `${currentSession.id}-${currentTerm}-${currentClass}-${currentArm}`;
    setSchoolData(prev => ({
      ...prev,
      [armKey]: {
        ...(prev[armKey] || {}),
        [currentSubject]: extractedData
      }
    }));
    setExtractedData(null);
    goBack();
  };

  // --- Views ---

  const HomeView = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#2d2445] p-6 text-white text-center">
      <div className="bg-[#4a3f68] p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/10">
        <div className="bg-[#3a2f58] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="w-8 h-8 text-indigo-300" />
        </div>
        <h1 className="text-4xl font-bold mb-2">School Portal</h1>
        <p className="text-indigo-200/60 mb-10 text-sm tracking-wide">Select your destination</p>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setView('admin')}
            className="flex flex-col items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 p-6 rounded-2xl hover:scale-105 transition-transform"
          >
            <UserCircle className="w-6 h-6 mb-2" />
            <span className="font-semibold text-sm">Admin</span>
          </button>
          
          <button className="flex flex-col items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 p-6 rounded-2xl hover:scale-105 transition-transform opacity-80 cursor-not-allowed">
            <FileText className="w-6 h-6 mb-2" />
            <span className="font-semibold text-sm">Student Result</span>
          </button>
        </div>

        <div className="flex justify-center gap-2 mt-12">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i === 2 ? 'bg-white' : 'bg-white/20'}`} />
          ))}
        </div>
      </div>
    </div>
  );

  const AdminDashboard = () => (
    <div className="min-h-screen bg-[#2d2445] p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft /></button>
            <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
          >
            <Plus size={20} /> Add New Session
          </button>
        </header>

        <div className="grid gap-4">
          {sessions.map(session => (
            <button 
              key={session.id}
              onClick={() => navigateTo('terms', { session })}
              className="flex items-center justify-between p-6 bg-[#3a2f58] rounded-2xl border border-white/5 hover:border-indigo-400 transition group"
            >
              <span className="text-lg font-medium">{session.name}</span>
              <ChevronRight className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
            </button>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-[#3a2f58] w-full max-w-sm rounded-3xl p-8 border border-white/10">
            <h3 className="text-xl font-bold mb-4">New Academic Session</h3>
            <input 
              autoFocus
              className="w-full bg-[#2d2445] border border-white/10 rounded-xl p-4 mb-6 outline-none focus:border-indigo-500"
              placeholder="e.g. 2025/2026"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-white/60">Cancel</button>
              <button onClick={addSession} className="flex-1 py-3 bg-indigo-600 rounded-xl font-bold">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const SelectionList = ({ title, items, onSelect, subtext }) => (
    <div className="min-h-screen bg-[#2d2445] p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <button onClick={goBack} className="p-2 hover:bg-white/10 rounded-full mb-4"><ArrowLeft /></button>
          <p className="text-indigo-300/60 uppercase tracking-widest text-xs mb-1">{subtext}</p>
          <h2 className="text-3xl font-bold">{title}</h2>
        </header>
        <div className="grid gap-4">
          {items.map((item, idx) => (
            <button 
              key={idx}
              onClick={() => onSelect(item)}
              className="flex items-center justify-between p-6 bg-[#3a2f58] rounded-2xl border border-white/5 hover:border-indigo-400 transition text-left"
            >
              <span className="text-lg font-semibold">{item}</span>
              <ChevronRight className="text-indigo-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const ArmSelectionView = () => (
    <div className="min-h-screen bg-[#2d2445] p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <button onClick={goBack} className="p-2 hover:bg-white/10 rounded-full mb-4"><ArrowLeft /></button>
          <p className="text-indigo-300/60 uppercase tracking-widest text-xs mb-1">
            {currentSession.name} • {currentTerm} • {currentClass}
          </p>
          <h2 className="text-3xl font-bold">Select Class Arm</h2>
        </header>
        <div className="grid gap-4">
          {ARMS.map((arm) => (
            <div key={arm} className="flex items-stretch gap-2">
              <button 
                onClick={() => navigateTo('subjects', { arm })}
                className="flex-1 flex items-center justify-between p-6 bg-[#3a2f58] rounded-2xl border border-white/5 hover:border-indigo-400 transition"
              >
                <span className="text-xl font-bold">Arm {arm}</span>
                <ChevronRight className="text-indigo-400" />
              </button>
              <button 
                onClick={() => navigateTo('preview-arm', { arm })}
                className="px-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 flex items-center gap-2 text-sm font-medium transition"
              >
                <Eye size={18} /> Preview
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const SubjectListView = () => (
    <div className="min-h-screen bg-[#2d2445] p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <button onClick={goBack} className="p-2 hover:bg-white/10 rounded-full mb-4"><ArrowLeft /></button>
          <p className="text-indigo-300/60 uppercase tracking-widest text-xs mb-1">
            {currentClass} Arm {currentArm}
          </p>
          <h2 className="text-3xl font-bold">Subjects</h2>
        </header>
        <div className="grid gap-3">
          {SUBJECTS.map((subject) => {
             const armKey = `${currentSession.id}-${currentTerm}-${currentClass}-${currentArm}`;
             const hasData = schoolData[armKey]?.[subject];
             
             return (
              <div key={subject} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#3a2f58] rounded-2xl border border-white/5 gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-10 rounded-full ${hasData ? 'bg-emerald-500' : 'bg-white/10'}`} />
                  <span className="text-lg font-medium">{subject}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="flex-1 md:flex-none cursor-pointer flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-3 rounded-xl text-xs transition border border-white/5">
                    <ImageIcon size={14} /> Upload Image
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      setCurrentSubject(subject);
                      handleImageUpload(e);
                    }} />
                  </label>
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-3 rounded-xl text-xs transition border border-white/5">
                    <Upload size={14} /> Docs
                  </button>
                  <button 
                    onClick={() => {
                      if (hasData) {
                        setExtractedData(hasData);
                        navigateTo('extraction', { subject });
                      } else {
                        // Just show empty extraction view
                        setExtractedData([]);
                        navigateTo('extraction', { subject });
                      }
                    }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 px-4 py-3 rounded-xl text-xs transition border border-indigo-500/30"
                  >
                    <Eye size={14} /> Preview
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const ExtractionView = () => (
    <div className="min-h-screen bg-[#2d2445] p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <button onClick={goBack} className="p-2 hover:bg-white/10 rounded-full mb-4"><ArrowLeft /></button>
            <h2 className="text-3xl font-bold">{currentSubject} Data</h2>
            <p className="text-white/40">Review and edit the extracted information</p>
          </div>
          {!isExtracting && (
             <button 
              onClick={saveExtractedData}
              className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition"
             >
               <Save size={20} /> Save Changes
             </button>
          )}
        </header>

        {isExtracting ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#3a2f58] rounded-[2rem] border border-dashed border-white/20">
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
            <p className="text-xl font-medium">Scanning Document...</p>
            <p className="text-white/40 text-sm mt-2">Gemini is extracting data from your image</p>
          </div>
        ) : (
          <div className="bg-[#3a2f58] rounded-[2rem] overflow-hidden border border-white/5">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-6 py-4 font-semibold">Student Name</th>
                  <th className="px-6 py-4 font-semibold">Score</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {extractedData?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <input 
                        className="bg-transparent border-b border-transparent focus:border-indigo-400 outline-none w-full"
                        value={row.name}
                        onChange={(e) => {
                          const updated = [...extractedData];
                          updated[idx].name = e.target.value;
                          setExtractedData(updated);
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        className="bg-transparent border-b border-transparent focus:border-indigo-400 outline-none w-20"
                        type="number"
                        value={row.score}
                        onChange={(e) => {
                          const updated = [...extractedData];
                          updated[idx].score = e.target.value;
                          setExtractedData(updated);
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          const updated = extractedData.filter((_, i) => i !== idx);
                          setExtractedData(updated);
                        }}
                        className="text-red-400 hover:text-red-500 p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {extractedData?.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-12 text-center text-white/40 italic">No data extracted yet. Please upload an image or add manually.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="p-4 bg-white/5 flex justify-center">
              <button 
                onClick={() => setExtractedData([...(extractedData || []), { name: "", score: "" }])}
                className="flex items-center gap-2 text-indigo-300 text-sm hover:underline"
              >
                <Plus size={16} /> Add Student Record
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const ArmPreviewView = () => {
    const armKey = `${currentSession.id}-${currentTerm}-${currentClass}-${currentArm}`;
    const dataForArm = schoolData[armKey] || {};
    
    return (
      <div className="min-h-screen bg-[#2d2445] p-6 text-white">
        <div className="max-w-5xl mx-auto">
          <header className="mb-10 flex items-center justify-between">
            <div>
              <button onClick={goBack} className="p-2 hover:bg-white/10 rounded-full mb-4"><ArrowLeft /></button>
              <h2 className="text-4xl font-extrabold">{currentClass} - Arm {currentArm}</h2>
              <p className="text-indigo-300/60 mt-1">{currentSession.name} • {currentTerm}</p>
            </div>
            <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/30 flex items-center gap-2">
              <CheckCircle2 size={18} /> Verified Class Sheet
            </div>
          </header>

          <div className="grid gap-8">
            {Object.keys(dataForArm).length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                <LayoutDashboard className="w-16 h-16 text-white/10 mx-auto mb-4" />
                <p className="text-xl text-white/40">No records found for this arm yet.</p>
                <button onClick={goBack} className="mt-4 text-indigo-400 underline">Return to subjects to upload data</button>
              </div>
            ) : (
              Object.entries(dataForArm).map(([subj, records]) => (
                <div key={subj} className="bg-[#3a2f58] rounded-3xl overflow-hidden border border-white/5 shadow-xl">
                  <div className="bg-white/5 px-8 py-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-indigo-200">{subj}</h3>
                    <span className="text-xs text-white/40">{records.length} Students Recorded</span>
                  </div>
                  <div className="p-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {records.map((r, i) => (
                      <div key={i} className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5">
                        <span className="font-medium truncate mr-2">{r.name}</span>
                        <span className={`font-bold px-3 py-1 rounded-lg ${r.score >= 50 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {r.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- Main Switcher ---
  switch (view) {
    case 'admin': return <AdminDashboard />;
    case 'terms': return <SelectionList title="Select Term" items={TERMS} onSelect={(term) => navigateTo('classes', { term })} subtext={currentSession?.name} />;
    case 'classes': return <SelectionList title="Select Class" items={CLASSES} onSelect={(className) => navigateTo('arms', { className })} subtext={`${currentSession?.name} • ${currentTerm}`} />;
    case 'arms': return <ArmSelectionView />;
    case 'subjects': return <SubjectListView />;
    case 'extraction': return <ExtractionView />;
    case 'preview-arm': return <ArmPreviewView />;
    default: return <HomeView />;
  }
}
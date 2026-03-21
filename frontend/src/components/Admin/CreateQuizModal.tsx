import React, { useState, useEffect } from 'react';
import { FaTimes, FaUpload, FaEdit, FaFileCode, FaTrash } from 'react-icons/fa';
import { API_ENDPOINTS, fetchOptions } from '../../config/api';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
}

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuizCreated: () => void;
}

const CreateQuizModal: React.FC<CreateQuizModalProps> = ({ isOpen, onClose, onQuizCreated }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');
  const [quizData, setQuizData] = useState({
    title: '', type: 'practice', duration: 30, questions: [] as Question[], max_attempts: 1
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    text: '', options: ['', '', '', ''], correctAnswer: 0,
  });
  const [error, setError] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setQuizData({ title: '', type: 'practice', duration: 30, questions: [], max_attempts: 1 });
      setCurrentQuestion({ text: '', options: ['', '', '', ''], correctAnswer: 0 });
      setError(''); setActiveTab('manual'); setUploadFile(null); setUploading(false); setUploadResult(''); setSubmitting(false);
    }
  }, [isOpen]);

  const resetForm = () => {
    setQuizData({ title: '', type: 'practice', duration: 30, questions: [], max_attempts: 1 });
    setCurrentQuestion({ text: '', options: ['', '', '', ''], correctAnswer: 0 });
    setError(''); setUploadFile(null); setUploadResult('');
  };

  const addQuestion = () => {
    if (!currentQuestion.text || currentQuestion.options.some(opt => !opt)) {
      setError('Please fill in all question fields'); return;
    }
    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, { ...currentQuestion, id: prev.questions.length + 1 }],
    }));
    setCurrentQuestion({ text: '', options: ['', '', '', ''], correctAnswer: 0 });
    setError('');
  };

  const handleSubmit = async (saveAsDraft = false) => {
    try {
      if (!quizData.title) { setError('Please enter a quiz title'); return; }
      if (quizData.questions.length === 0) { setError('Please add at least one question'); return; }
      setSubmitting(true); setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.CREATE_QUIZ, {
        method: 'POST', ...fetchOptions,
        headers: { ...fetchOptions.headers, 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: quizData.title, type: quizData.type, duration: quizData.duration,
          questions: quizData.questions.map(q => ({ text: q.text, options: q.options, correctAnswer: q.correctAnswer })),
          is_draft: saveAsDraft, max_attempts: quizData.type === 'exam' ? 1 : quizData.max_attempts
        })
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.detail || 'Failed to create quiz'); }
      await response.json(); onQuizCreated(); onClose(); resetForm();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to create quiz'); }
    finally { setSubmitting(false); }
  };

  const handleFileUpload = async (saveAsDraft = false) => {
    try {
      if (!quizData.title) { setError('Please enter a quiz title'); return; }
      if (!uploadFile) { setError('Please select a JSON or XML file'); return; }
      setUploading(true); setError(''); setUploadResult('');
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', quizData.title);
      formData.append('duration', quizData.duration.toString());
      formData.append('type', quizData.type);
      formData.append('max_attempts', (quizData.type === 'exam' ? 1 : quizData.max_attempts).toString());
      formData.append('is_draft', saveAsDraft.toString());
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.UPLOAD_FILE_QUIZ, {
        method: 'POST', credentials: 'include',
        headers: { 'Authorization': `Bearer ${token}` }, body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to create quiz from file');
      setUploadResult(`✅ ${data.message}`);
      setTimeout(() => { onQuizCreated(); onClose(); resetForm(); }, 2000);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to upload file'); }
    finally { setUploading(false); }
  };

  if (!isOpen) return null;

  const inp: React.CSSProperties = {
    width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: '6px',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box'
  };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '2px' };
  const btn1: React.CSSProperties = {
    padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none',
    borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '13px'
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start',
      justifyContent: 'center', paddingTop: '40px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '10px', width: '100%', maxWidth: '680px',
        maxHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden', margin: '0 16px'
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: '12px 18px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Create New Quiz</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}><FaTimes /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb', flexShrink: 0 }}>
          {[
            { key: 'manual' as const, icon: <FaEdit />, label: 'Manual Entry' },
            { key: 'upload' as const, icon: <FaFileCode />, label: 'Upload JSON / XML' }
          ].map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setError(''); }} style={{
              flex: 1, padding: '8px 12px', textAlign: 'center', cursor: 'pointer', fontWeight: 600,
              fontSize: '13px', border: 'none', outline: 'none', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px',
              backgroundColor: activeTab === t.key ? '#fff' : 'transparent',
              color: activeTab === t.key ? '#2563eb' : '#6b7280',
              borderBottom: activeTab === t.key ? '3px solid #2563eb' : '3px solid transparent',
            }}>{t.icon} {t.label}</button>
          ))}
        </div>

        {/* Messages */}
        {error && <div style={{ margin: '8px 14px 0', padding: '6px 10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', fontSize: '12px' }}>{error}</div>}
        {uploadResult && <div style={{ margin: '8px 14px 0', padding: '6px 10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: '6px', fontSize: '12px' }}>{uploadResult}</div>}

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px' }}>

          {/* Quiz Details - compact row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <div>
              <label style={lbl}>Quiz Title</label>
              <input type="text" style={inp} placeholder="Enter title" value={quizData.title}
                onChange={e => setQuizData({ ...quizData, title: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>Duration (min)</label>
              <input type="number" style={inp} min="1" value={quizData.duration}
                onChange={e => setQuizData({ ...quizData, duration: parseInt(e.target.value) || 1 })} />
            </div>
            <div>
              <label style={lbl}>Type</label>
              <select style={inp} value={quizData.type}
                onChange={e => setQuizData({ ...quizData, type: e.target.value, max_attempts: e.target.value === 'exam' ? 1 : quizData.max_attempts })}>
                <option value="practice">Practice</option>
                <option value="exam">Exam</option>
              </select>
            </div>
          </div>

          {quizData.type === 'practice' && (
            <div style={{ marginBottom: '10px', maxWidth: '200px' }}>
              <label style={lbl}>Max Attempts</label>
              <input type="number" style={inp} min="1" value={quizData.max_attempts}
                onChange={e => setQuizData({ ...quizData, max_attempts: parseInt(e.target.value) || 1 })} />
            </div>
          )}

          {/* ─── MANUAL TAB ─── */}
          {activeTab === 'manual' && (
            <>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600 }}>Add New Question</h3>
                <div style={{ marginBottom: '8px' }}>
                  <label style={lbl}>Question Text</label>
                  <input type="text" style={inp} placeholder="Enter your question" value={currentQuestion.text}
                    onChange={e => setCurrentQuestion({ ...currentQuestion, text: e.target.value })} />
                </div>

                {/* All 4 options in 2x2 grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                  {currentQuestion.options.map((option, i) => (
                    <div key={i}>
                      <label style={lbl}>Option {String.fromCharCode(65 + i)}</label>
                      <div style={{ display: 'flex' }}>
                        <input type="text" value={option} style={{ ...inp, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 'none' }}
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          onChange={e => {
                            const opts = [...currentQuestion.options]; opts[i] = e.target.value;
                            setCurrentQuestion({ ...currentQuestion, options: opts });
                          }} />
                        <button type="button"
                          onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: i })}
                          style={{
                            padding: '4px 10px', border: '1px solid #d1d5db', borderTopRightRadius: '6px',
                            borderBottomRightRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                            backgroundColor: currentQuestion.correctAnswer === i ? '#22c55e' : '#f3f4f6',
                            color: currentQuestion.correctAnswer === i ? '#fff' : '#9ca3af',
                          }}>✓</button>
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={addQuestion} style={{ ...btn1, width: '100%', padding: '7px' }}>
                  + Add Question
                </button>
              </div>

              {/* Added questions list */}
              {quizData.questions.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 600 }}>
                    Questions ({quizData.questions.length})
                  </h3>
                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {quizData.questions.map((q, i) => (
                      <div key={i} style={{ padding: '8px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '4px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong>Q{i + 1}: {q.text}</strong>
                          <button onClick={() => setQuizData(prev => ({ ...prev, questions: prev.questions.filter((_, j) => j !== i) }))}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><FaTrash size={10} /></button>
                        </div>
                        <div style={{ marginTop: '3px', paddingLeft: '8px', color: '#6b7280' }}>
                          {q.options.map((o, oi) => (
                            <span key={oi} style={{ marginRight: '10px', color: oi === q.correctAnswer ? '#16a34a' : '#6b7280', fontWeight: oi === q.correctAnswer ? 600 : 400 }}>
                              {String.fromCharCode(65 + oi)}) {o}{oi === q.correctAnswer ? ' ✓' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── UPLOAD TAB ─── */}
          {activeTab === 'upload' && (
            <div>
              <div style={{
                padding: '20px', borderRadius: '10px', textAlign: 'center',
                border: '2px dashed #93c5fd', backgroundColor: '#eff6ff', marginBottom: '12px'
              }}>
                <FaUpload style={{ fontSize: '24px', color: '#3b82f6', marginBottom: '8px' }} />
                <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600 }}>Upload Quiz File</h3>
                <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#6b7280' }}>
                  Upload a <strong>JSON</strong> or <strong>XML</strong> file with your questions
                </p>
                <input type="file" accept=".json,.xml" id="file-upload" style={{ display: 'none' }}
                  onChange={e => { setUploadFile(e.target.files?.[0] || null); setError(''); setUploadResult(''); }} />
                <label htmlFor="file-upload" style={{ ...btn1, display: 'inline-block', cursor: 'pointer', padding: '8px 20px' }}>
                  {uploadFile ? '📄 Change File' : '📁 Select File'}
                </label>
                {uploadFile && (
                  <p style={{ marginTop: '8px', fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                    ✅ {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* Compact format guides side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600 }}>📋 JSON Format:</h4>
                  <pre style={{ backgroundColor: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#475569', fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0 }}>
{`{ "questions": [
  { "text": "Q?",
    "options": ["A","B","C","D"],
    "correctAnswer": 1 }
]}`}
                  </pre>
                  <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#94a3b8' }}>correctAnswer = index (0-3)</p>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600 }}>📋 XML Format:</h4>
                  <pre style={{ backgroundColor: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#475569', fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0 }}>
{`<quiz>
 <question>
  <text>Q?</text>
  <option>A</option>
  <option correct="true">B</option>
 </question>
</quiz>`}
                  </pre>
                  <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#94a3b8' }}>correct="true" on answer</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 18px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '8px', backgroundColor: '#f9fafb', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '8px 14px', backgroundColor: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
          {activeTab === 'manual' ? (
            <>
              <button onClick={() => handleSubmit(true)} disabled={submitting}
                style={{ padding: '8px 14px', backgroundColor: '#6b7280', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '13px', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? '⏳ Saving...' : 'Save as Draft'}
              </button>
              <button onClick={() => handleSubmit(false)} disabled={submitting}
                style={{ ...btn1, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {submitting ? (
                  <><span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Publishing...</>
                ) : 'Publish Quiz'}
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </>
          ) : (
            <>
              <button onClick={() => handleFileUpload(true)} disabled={uploading || !uploadFile}
                style={{ padding: '8px 14px', backgroundColor: '#6b7280', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: (uploading || !uploadFile) ? 'not-allowed' : 'pointer', fontSize: '13px', opacity: (uploading || !uploadFile) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {uploading ? (
                  <><span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Uploading...</>
                ) : 'Upload Draft'}
              </button>
              <button onClick={() => handleFileUpload(false)} disabled={uploading || !uploadFile}
                style={{ ...btn1, cursor: (uploading || !uploadFile) ? 'not-allowed' : 'pointer', opacity: (uploading || !uploadFile) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {uploading ? (
                  <><span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Publishing...</>
                ) : 'Upload & Publish'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateQuizModal;
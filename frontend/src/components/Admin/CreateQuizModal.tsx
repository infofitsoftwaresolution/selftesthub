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
    title: '',
    type: 'practice',
    duration: 30,
    questions: [] as Question[],
    max_attempts: 1
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
  });

  const [error, setError] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setQuizData({ title: '', type: 'practice', duration: 30, questions: [], max_attempts: 1 });
      setCurrentQuestion({ text: '', options: ['', '', '', ''], correctAnswer: 0 });
      setError('');
      setActiveTab('manual');
      setUploadFile(null);
      setUploading(false);
      setUploadResult('');
    }
  }, [isOpen]);

  const resetForm = () => {
    setQuizData({ title: '', type: 'practice', duration: 30, questions: [], max_attempts: 1 });
    setCurrentQuestion({ text: '', options: ['', '', '', ''], correctAnswer: 0 });
    setError('');
    setUploadFile(null);
    setUploadResult('');
  };

  const addQuestion = () => {
    if (!currentQuestion.text || currentQuestion.options.some(opt => !opt)) {
      setError('Please fill in all question fields');
      return;
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

      const formattedQuestions = quizData.questions.map(q => ({
        text: q.text, options: q.options, correctAnswer: q.correctAnswer
      }));

      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.CREATE_QUIZ, {
        method: 'POST',
        ...fetchOptions,
        headers: { ...fetchOptions.headers, 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: quizData.title, type: quizData.type, duration: quizData.duration,
          questions: formattedQuestions, is_draft: saveAsDraft,
          max_attempts: quizData.type === 'exam' ? 1 : quizData.max_attempts
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to create quiz');
      }
      await response.json();
      onQuizCreated();
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quiz');
    }
  };

  const handleFileUpload = async (saveAsDraft = false) => {
    try {
      if (!quizData.title) { setError('Please enter a quiz title'); return; }
      if (!uploadFile) { setError('Please select a JSON or XML file'); return; }

      setUploading(true);
      setError('');
      setUploadResult('');

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', quizData.title);
      formData.append('duration', quizData.duration.toString());
      formData.append('type', quizData.type);
      formData.append('max_attempts', (quizData.type === 'exam' ? 1 : quizData.max_attempts).toString());
      formData.append('is_draft', saveAsDraft.toString());

      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.UPLOAD_FILE_QUIZ, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to create quiz from file');

      setUploadResult(`✅ ${data.message}`);
      setTimeout(() => { onQuizCreated(); onClose(); resetForm(); }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  // ─── Inline Styles ───
  const overlay: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '20px'
  };
  const modal: React.CSSProperties = {
    backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '720px',
    maxHeight: '85vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)', overflow: 'hidden'
  };
  const header: React.CSSProperties = {
    padding: '20px 24px', borderBottom: '1px solid #e5e7eb',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff'
  };
  const tabBar: React.CSSProperties = {
    display: 'flex', borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb'
  };
  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '12px 16px', textAlign: 'center' as const, cursor: 'pointer',
    fontWeight: 600, fontSize: '14px', border: 'none', outline: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    backgroundColor: active ? '#fff' : 'transparent',
    color: active ? '#2563eb' : '#6b7280',
    borderBottom: active ? '3px solid #2563eb' : '3px solid transparent',
    transition: 'all 0.2s'
  });
  const scrollArea: React.CSSProperties = {
    flex: 1, overflowY: 'auto', padding: '20px 24px'
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
    borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151',
    marginBottom: '4px'
  };
  const footerStyle: React.CSSProperties = {
    padding: '16px 24px', borderTop: '1px solid #e5e7eb',
    display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#f9fafb'
  };
  const btnPrimary: React.CSSProperties = {
    padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff',
    border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
    fontSize: '14px', transition: 'background 0.2s'
  };
  const btnSecondary: React.CSSProperties = {
    padding: '10px 20px', backgroundColor: '#6b7280', color: '#fff',
    border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
    fontSize: '14px'
  };
  const btnOutline: React.CSSProperties = {
    padding: '10px 20px', backgroundColor: '#fff', color: '#374151',
    border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: 500,
    cursor: 'pointer', fontSize: '14px'
  };
  const sectionCard: React.CSSProperties = {
    backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px',
    border: '1px solid #e2e8f0', marginBottom: '16px'
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={header}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Create New Quiz</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px'
          }}><FaTimes /></button>
        </div>

        {/* Tab Bar */}
        <div style={tabBar}>
          <button style={tabStyle(activeTab === 'manual')}
            onClick={() => { setActiveTab('manual'); setError(''); }}>
            <FaEdit /> Manual Entry
          </button>
          <button style={tabStyle(activeTab === 'upload')}
            onClick={() => { setActiveTab('upload'); setError(''); }}>
            <FaFileCode /> Upload JSON / XML
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            margin: '12px 24px 0', padding: '10px 14px', backgroundColor: '#fef2f2',
            border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px',
            fontSize: '13px', fontWeight: 500
          }}>{error}</div>
        )}
        {uploadResult && (
          <div style={{
            margin: '12px 24px 0', padding: '10px 14px', backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: '8px',
            fontSize: '13px', fontWeight: 500
          }}>{uploadResult}</div>
        )}

        {/* Scrollable Content */}
        <div style={scrollArea}>
          {/* Quiz Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Quiz Title</label>
              <input type="text" style={inputStyle} placeholder="Enter quiz title"
                value={quizData.title}
                onChange={(e) => setQuizData({ ...quizData, title: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Duration (minutes)</label>
              <input type="number" style={inputStyle} min="1"
                value={quizData.duration}
                onChange={(e) => setQuizData({ ...quizData, duration: parseInt(e.target.value) || 1 })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Quiz Type</label>
              <select style={inputStyle} value={quizData.type}
                onChange={(e) => setQuizData({ ...quizData, type: e.target.value, max_attempts: e.target.value === 'exam' ? 1 : quizData.max_attempts })}>
                <option value="practice">Practice</option>
                <option value="exam">Exam</option>
              </select>
            </div>
            {quizData.type === 'practice' && (
              <div>
                <label style={labelStyle}>Maximum Attempts</label>
                <input type="number" style={inputStyle} min="1"
                  value={quizData.max_attempts}
                  onChange={(e) => setQuizData({ ...quizData, max_attempts: parseInt(e.target.value) || 1 })} />
              </div>
            )}
          </div>

          {/* ─── MANUAL TAB ─── */}
          {activeTab === 'manual' && (
            <>
              <div style={sectionCard}>
                <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
                  Add New Question
                </h3>

                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Question Text</label>
                  <input type="text" style={inputStyle} placeholder="Enter your question"
                    value={currentQuestion.text}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  {currentQuestion.options.map((option, index) => (
                    <div key={index}>
                      <label style={labelStyle}>Option {String.fromCharCode(65 + index)}</label>
                      <div style={{ display: 'flex', gap: '0' }}>
                        <input type="text" value={option}
                          style={{
                            ...inputStyle,
                            borderTopRightRadius: 0, borderBottomRightRadius: 0,
                            borderRight: 'none'
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          onChange={(e) => {
                            const newOptions = [...currentQuestion.options];
                            newOptions[index] = e.target.value;
                            setCurrentQuestion({ ...currentQuestion, options: newOptions });
                          }} />
                        <button type="button"
                          onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                          style={{
                            padding: '8px 14px', border: '1px solid #d1d5db',
                            borderTopRightRadius: '8px', borderBottomRightRadius: '8px',
                            cursor: 'pointer', fontWeight: 700, fontSize: '14px',
                            backgroundColor: currentQuestion.correctAnswer === index ? '#22c55e' : '#f3f4f6',
                            color: currentQuestion.correctAnswer === index ? '#fff' : '#9ca3af',
                            transition: 'all 0.2s'
                          }}>✓</button>
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={addQuestion} style={{
                  ...btnPrimary, width: '100%', padding: '10px'
                }}>+ Add Question</button>
              </div>

              {/* Questions List */}
              {quizData.questions.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
                    Questions Added ({quizData.questions.length})
                  </h3>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {quizData.questions.map((question, index) => (
                      <div key={index} style={{
                        padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px',
                        border: '1px solid #e2e8f0', marginBottom: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <strong style={{ color: '#1e293b', fontSize: '13px' }}>Q{index + 1}: {question.text}</strong>
                          <button onClick={() => setQuizData(prev => ({
                            ...prev, questions: prev.questions.filter((_, i) => i !== index)
                          }))} style={{
                            background: 'none', border: 'none', color: '#ef4444',
                            cursor: 'pointer', padding: '2px'
                          }}><FaTrash size={12} /></button>
                        </div>
                        <div style={{ marginTop: '6px', paddingLeft: '12px' }}>
                          {question.options.map((opt, optIdx) => (
                            <div key={optIdx} style={{
                              fontSize: '12px', padding: '2px 0',
                              color: optIdx === question.correctAnswer ? '#16a34a' : '#6b7280',
                              fontWeight: optIdx === question.correctAnswer ? 600 : 400
                            }}>
                              {String.fromCharCode(65 + optIdx)}) {opt}
                              {optIdx === question.correctAnswer && ' ✓'}
                            </div>
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
              {/* Upload Area */}
              <div style={{
                padding: '30px 20px', borderRadius: '12px', textAlign: 'center',
                border: '2px dashed #93c5fd', backgroundColor: '#eff6ff', marginBottom: '20px'
              }}>
                <FaUpload style={{ fontSize: '32px', color: '#3b82f6', marginBottom: '12px' }} />
                <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
                  Upload Quiz File
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280' }}>
                  Upload a <strong>JSON</strong> or <strong>XML</strong> file with your questions
                </p>

                <input type="file" accept=".json,.xml" id="file-upload" style={{ display: 'none' }}
                  onChange={(e) => { setUploadFile(e.target.files?.[0] || null); setError(''); setUploadResult(''); }} />
                <label htmlFor="file-upload" style={{
                  ...btnPrimary, display: 'inline-block', cursor: 'pointer', padding: '10px 24px'
                }}>
                  {uploadFile ? '📄 Change File' : '📁 Select JSON or XML File'}
                </label>

                {uploadFile && (
                  <p style={{ marginTop: '12px', fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>
                    ✅ Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* JSON Format Guide */}
              <div style={sectionCard}>
                <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                  📋 JSON Format Example:
                </h4>
                <pre style={{
                  backgroundColor: '#fff', padding: '12px', borderRadius: '8px',
                  border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569',
                  fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0, overflowX: 'auto'
                }}>
{`{
  "questions": [
    {
      "text": "What is the capital of India?",
      "options": ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
      "correctAnswer": 1
    }
  ]
}`}
                </pre>
                <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                  correctAnswer is the index (0 = first option, 1 = second, etc.)
                </p>
              </div>

              {/* XML Format Guide */}
              <div style={sectionCard}>
                <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                  📋 XML Format Example:
                </h4>
                <pre style={{
                  backgroundColor: '#fff', padding: '12px', borderRadius: '8px',
                  border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569',
                  fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0, overflowX: 'auto'
                }}>
{`<quiz>
  <question>
    <text>What is the capital of India?</text>
    <option>Mumbai</option>
    <option correct="true">New Delhi</option>
    <option>Kolkata</option>
    <option>Chennai</option>
  </question>
</quiz>`}
                </pre>
                <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                  Mark the correct option with correct="true"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button onClick={onClose} style={btnOutline}>Cancel</button>
          {activeTab === 'manual' ? (
            <>
              <button onClick={() => handleSubmit(true)} style={btnSecondary}>Save as Draft</button>
              <button onClick={() => handleSubmit(false)} style={btnPrimary}>Publish Quiz</button>
            </>
          ) : (
            <>
              <button onClick={() => handleFileUpload(true)}
                disabled={uploading || !uploadFile}
                style={{ ...btnSecondary, opacity: (uploading || !uploadFile) ? 0.5 : 1 }}>
                {uploading ? '⏳ Processing...' : 'Upload as Draft'}
              </button>
              <button onClick={() => handleFileUpload(false)}
                disabled={uploading || !uploadFile}
                style={{ ...btnPrimary, opacity: (uploading || !uploadFile) ? 0.5 : 1 }}>
                {uploading ? '⏳ Processing...' : 'Upload & Publish'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateQuizModal;
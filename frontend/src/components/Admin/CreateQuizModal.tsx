import React, { useState, useEffect } from 'react';
import { FaTimes, FaUpload, FaEdit, FaFileCode } from 'react-icons/fa';
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

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Create New Quiz</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><FaTimes /></button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setActiveTab('manual'); setError(''); }}
            className={`flex-1 py-3 px-4 text-center font-medium flex items-center justify-center gap-2 ${
              activeTab === 'manual' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FaEdit /> Manual Entry
          </button>
          <button
            onClick={() => { setActiveTab('upload'); setError(''); }}
            className={`flex-1 py-3 px-4 text-center font-medium flex items-center justify-center gap-2 ${
              activeTab === 'upload' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FaFileCode /> Upload JSON / XML
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded whitespace-pre-wrap">{error}</div>
        )}
        {uploadResult && (
          <div className="mx-6 mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{uploadResult}</div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Common Quiz Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
              <input type="text" value={quizData.title}
                onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quiz title" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input type="number" value={quizData.duration}
                onChange={(e) => setQuizData({ ...quizData, duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" min="1" />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Type</label>
            <select value={quizData.type}
              onChange={(e) => setQuizData({ ...quizData, type: e.target.value, max_attempts: e.target.value === 'exam' ? 1 : quizData.max_attempts })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="practice">Practice</option>
              <option value="exam">Exam</option>
            </select>
          </div>

          {quizData.type === 'practice' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Attempts</label>
              <input type="number" value={quizData.max_attempts}
                onChange={(e) => setQuizData({ ...quizData, max_attempts: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" min="1" />
            </div>
          )}

          {/* ============ MANUAL TAB ============ */}
          {activeTab === 'manual' && (
            <>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-medium mb-4">Add New Question</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                    <textarea value={currentQuestion.text}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
                      placeholder="Enter question" rows={3} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Option {index + 1}</label>
                        <div className="flex">
                          <textarea value={option}
                            onChange={(e) => {
                              const newOptions = [...currentQuestion.options];
                              newOptions[index] = e.target.value;
                              setCurrentQuestion({ ...currentQuestion, options: newOptions });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[60px]"
                            placeholder={`Option ${index + 1}`} rows={2} />
                          <button type="button"
                            onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                            className={`px-4 rounded-r-md ${currentQuestion.correctAnswer === index ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            ✓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button type="button" onClick={addQuestion}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    Add Question
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Questions Added ({quizData.questions.length})</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {quizData.questions.map((question, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">Q{index + 1}:</span>
                        <button onClick={() => setQuizData(prev => ({
                          ...prev, questions: prev.questions.filter((_, i) => i !== index)
                        }))} className="text-red-500 hover:text-red-700"><FaTimes /></button>
                      </div>
                      <div className="mt-1 whitespace-pre-wrap">{question.text}</div>
                      <div className="mt-2 space-y-1 ml-4">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className={optIndex === question.correctAnswer ? 'text-green-600 font-medium' : ''}>
                            <span>{optIndex + 1}. </span><span className="whitespace-pre-wrap">{option}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ============ UPLOAD TAB ============ */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* File Upload Area */}
              <div className="bg-blue-50 p-6 rounded-lg border-2 border-dashed border-blue-300">
                <div className="text-center">
                  <FaUpload className="mx-auto text-blue-500 text-3xl mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Quiz File</h3>
                  <p className="text-sm text-gray-600 mb-4">Upload a <strong>JSON</strong> or <strong>XML</strong> file with your questions</p>

                  <input type="file" accept=".json,.xml"
                    onChange={(e) => { setUploadFile(e.target.files?.[0] || null); setError(''); setUploadResult(''); }}
                    className="hidden" id="file-upload" />
                  <label htmlFor="file-upload"
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors">
                    {uploadFile ? '📄 Change File' : '📁 Select JSON or XML File'}
                  </label>

                  {uploadFile && (
                    <p className="mt-3 text-sm text-green-600 font-medium">
                      ✅ Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              </div>

              {/* Format Guide - JSON */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">📋 JSON Format:</h4>
                <pre className="text-sm text-gray-600 bg-white p-3 rounded border font-mono whitespace-pre-wrap">
{`{
  "questions": [
    {
      "text": "What is the capital of India?",
      "options": ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
      "correctAnswer": 1
    },
    {
      "text": "Which planet is closest to the Sun?",
      "options": ["Venus", "Earth", "Mercury", "Mars"],
      "correctAnswer": 2
    }
  ]
}`}
                </pre>
                <p className="mt-2 text-xs text-gray-500">
                  • <code>correctAnswer</code> is the index (0 = first option, 1 = second, etc.)<br/>
                  • You can also use <code>"answer": "b"</code> (letter) instead of index<br/>
                  • Both <code>"text"</code> and <code>"question"</code> field names are supported
                </p>
              </div>

              {/* Format Guide - XML */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">📋 XML Format:</h4>
                <pre className="text-sm text-gray-600 bg-white p-3 rounded border font-mono whitespace-pre-wrap">
{`<quiz>
  <question>
    <text>What is the capital of India?</text>
    <option>Mumbai</option>
    <option correct="true">New Delhi</option>
    <option>Kolkata</option>
    <option>Chennai</option>
  </question>
  <question>
    <text>Which planet is closest to the Sun?</text>
    <option>Venus</option>
    <option>Earth</option>
    <option correct="true">Mercury</option>
    <option>Mars</option>
  </question>
</quiz>`}
                </pre>
                <p className="mt-2 text-xs text-gray-500">
                  • Mark the correct option with <code>correct="true"</code><br/>
                  • Each question must have a <code>&lt;text&gt;</code> element and at least 2 <code>&lt;option&gt;</code> elements
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>

          {activeTab === 'manual' ? (
            <>
              <button onClick={() => handleSubmit(true)} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">Save as Draft</button>
              <button onClick={() => handleSubmit(false)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Publish Quiz</button>
            </>
          ) : (
            <>
              <button onClick={() => handleFileUpload(true)} disabled={uploading || !uploadFile}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                {uploading ? '⏳ Processing...' : 'Upload as Draft'}
              </button>
              <button onClick={() => handleFileUpload(false)} disabled={uploading || !uploadFile}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
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
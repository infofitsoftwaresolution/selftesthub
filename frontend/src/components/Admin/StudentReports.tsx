import React, { useState, useEffect } from 'react';
import { FaSearch, FaDownload, FaTrash } from 'react-icons/fa';
import { API_ENDPOINTS, fetchOptions } from '../../config/api';
import PageLoader from '../common/PageLoader';

interface User {
  id: number;
  full_name: string;
  email: string;
}

interface QuizAttempt {
  id: number;
  quiz: {
    id: number;
    title: string;
    duration: number;
  };
  started_at: string;
  completed_at: string;
  score: number | null;
  video_url?: string;
}

interface StudentReport {
  user: User;
  attempts: QuizAttempt[];
  averageScore: number;
}

// Enforce UTC parsing to fix 5.5 hour discrepancy
const formatAsUTC = (dateStr: string) => dateStr && !dateStr.endsWith('Z') ? `${dateStr}Z` : dateStr;
const getCappedTimeTaken = (start: string, end: string, duration: number) => {
  const diff = Math.floor((new Date(formatAsUTC(end)).getTime() - new Date(formatAsUTC(start)).getTime()) / 60000);
  return Math.max(0, Math.min(diff, duration));
};

const StudentReports: React.FC = () => {
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentReport | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.STUDENT_REPORTS, {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have permission to view student reports');
        }
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load student reports');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => 
    report.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCsv = (studentReport: StudentReport) => {
    const headers = ['Quiz Title', 'Score', 'Date', 'Time Taken'];
    const rows = studentReport.attempts.map(attempt => [
      attempt.quiz.title,
      attempt.score === null || (attempt.video_url && attempt.score === 0) ? 'TBD' : `${attempt.score}%`,
      new Date(formatAsUTC(attempt.completed_at)).toLocaleDateString(),
      `${getCappedTimeTaken(attempt.started_at, attempt.completed_at, attempt.quiz.duration)} minutes`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${studentReport.user.full_name}-report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteAttempt = async (attemptId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this attempt? This cannot be undone and will permanently delete the associated video if one exists.')) return;

    try {
      const response = await fetch(API_ENDPOINTS.DELETE_REPORT(attemptId), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      // Optimistically update the selected student view
      if (selectedStudent) {
        setSelectedStudent({
          ...selectedStudent,
          attempts: selectedStudent.attempts.filter(a => a.id !== attemptId)
        });
      }
      
      // Refresh the background list quietly
      fetchReports();
      
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete report');
    }
  };

  const handleUpdateScore = async (attemptId: number, newScore: number) => {
    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_REPORT_SCORE(attemptId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ score: newScore })
      });

      if (!response.ok) {
        throw new Error('Failed to update score');
      }

      // Optimistically update UI
      if (selectedStudent) {
        setSelectedStudent({
          ...selectedStudent,
          attempts: selectedStudent.attempts.map((a) =>
            a.id === attemptId ? { ...a, score: newScore } : a
          )
        });
      }
      
      // Refresh background data quietly
      fetchReports();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save the new score');
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Student Reports</h2>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <FaSearch size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Students List */}
        <div className="md:col-span-1 space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.user.id}
              onClick={() => setSelectedStudent(report)}
              className={`p-4 rounded-lg cursor-pointer transition-colors ${
                selectedStudent?.user.id === report.user.id
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-white hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <h3 className="font-semibold text-lg">{report.user.full_name}</h3>
              <p className="text-sm text-gray-600">{report.user.email}</p>
              <div className="mt-2 text-sm">
                <span className="text-blue-600">Average Score: {report.averageScore.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed View */}
        <div className="md:col-span-2 md:sticky md:top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
          {selectedStudent ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start border-b pb-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold">{selectedStudent.user.full_name}</h3>
                  <p className="text-gray-600">{selectedStudent.user.email}</p>
                </div>
                <button
                  onClick={() => exportToCsv(selectedStudent)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <FaDownload size={16} className="mr-2" />
                  Export Report
                </button>
              </div>

              <div className="space-y-4">
                {selectedStudent.attempts.map((attempt) => (
                  <div key={attempt.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <div>
                        <h4 className="font-medium">{attempt.quiz.title}</h4>
                        <p className="text-sm text-gray-600">
                          Completed: {new Date(formatAsUTC(attempt.completed_at)).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {attempt.video_url && (
                          <a 
                            href={attempt.video_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 flex items-center gap-2 transition"
                          >
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            Watch Interview
                          </a>
                        )}
                        {attempt.video_url ? (
                          <div className="flex items-center gap-2">
                            <div className="text-lg font-semibold">
                              Score: {attempt.score === null || (attempt.video_url && attempt.score === 0) ? 'TBD' : `${attempt.score}%`}
                            </div>
                            <select
                              className="text-sm border border-gray-300 rounded p-1 bg-white cursor-pointer shadow-sm hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                              value={attempt.score === null || (attempt.video_url && attempt.score === 0) ? '' : attempt.score}
                              onChange={(e) => handleUpdateScore(attempt.id, Number(e.target.value))}
                            >
                              <option value="" disabled>Assign Score...</option>
                              <option value={100}>Excellent (100%)</option>
                              <option value={80}>Good (80%)</option>
                              <option value={50}>Not Good Not Bad (50%)</option>
                              <option value={30}>Bad (30%)</option>
                              <option value={10}>Very Bad (10%)</option>
                            </select>
                          </div>
                        ) : (
                          <div className="text-lg font-semibold">
                            Score: {attempt.score === null || (attempt.video_url && attempt.score === 0) ? 'TBD' : `${attempt.score}%`}
                          </div>
                        )}
                        <button
                          onClick={(e) => handleDeleteAttempt(attempt.id, e)}
                          title="Delete Attempt"
                          className="ml-2 text-gray-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Select a student to view their report
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentReports; 
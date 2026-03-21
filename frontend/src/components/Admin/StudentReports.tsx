import React, { useState, useEffect } from 'react';
import { FaSearch, FaDownload } from 'react-icons/fa';
import { API_ENDPOINTS, fetchOptions } from '../../config/api';

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
  score: number;
}

interface StudentReport {
  user: User;
  attempts: QuizAttempt[];
  averageScore: number;
}

// Enforce UTC parsing to fix 5.5 hour discrepancy
const formatAsUTC = (dateStr: string) => dateStr && !dateStr.endsWith('Z') ? `${dateStr}Z` : dateStr;

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
      `${attempt.score}%`,
      new Date(formatAsUTC(attempt.completed_at)).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
      `${Math.floor((new Date(formatAsUTC(attempt.completed_at)).getTime() - new Date(formatAsUTC(attempt.started_at)).getTime()) / 60000)} minutes`
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
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
        <div className="md:col-span-2">
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
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{attempt.quiz.title}</h4>
                        <p className="text-sm text-gray-600">
                          Completed: {new Date(formatAsUTC(attempt.completed_at)).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </p>
                      </div>
                      <div className="text-lg font-semibold">
                        Score: {attempt.score}%
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
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Quiz } from '../../types/quiz';
import { API_ENDPOINTS, fetchOptions } from '../../config/api';
import QuizSecurity from './QuizSecurity';

const VideoQuizInterface: React.FC = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState('');
  
  // Video Recording State
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [permissionHelp, setPermissionHelp] = useState('');

  // Setup streaming
  const initCamera = async () => {
      setCameraError('');
      setPermissionHelp('');
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('This browser does not support camera access.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        // init recorder
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.error("Error accessing camera: ", err);
        setCameraError("Camera and microphone permission is required to take this quiz.");
        setPermissionHelp('Please allow camera and microphone in browser settings, then click Retry Permissions.');
      }
    };

  useEffect(() => {
    initCamera();

    return () => {
      // Cleanup streams
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Fetch quiz details
  useEffect(() => {
    const fetchQuizAndStart = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.QUIZ(quizId as string), {
          ...fetchOptions,
          headers: { 
            ...fetchOptions.headers,
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          }
        });
        if (!res.ok) throw new Error("Failed to load quiz");
        const data = await res.json();
        setQuiz(data);
        const initialTime = data.duration * 60;
        setTimeLeft(initialTime);
        setTotalTime(initialTime);

        // Start attempt
        const startRes = await fetch(API_ENDPOINTS.START_QUIZ(quizId as string), {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (startRes.ok) {
          const startData = await startRes.json();
          setAttemptId(startData.attemptId);
        }
      } catch (e) {
        console.error(e);
      }
    };
    if (quizId) fetchQuizAndStart();
  }, [quizId]);

  // Timer
  useEffect(() => {
    if (!isRecording || timeLeft <= 0 || isSubmitting) return;
    const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, isRecording, isSubmitting]);

  // Auto-submit on time up
  useEffect(() => {
    if (isRecording && timeLeft <= 0 && !isSubmitting) {
      alert("Time is up! Submitting video automatically.");
      handleFinish();
    }
  }, [timeLeft, isRecording]);

  const startRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      recordedChunksRef.current = [];
      mediaRecorderRef.current.start(1000); // chunk every second
      setIsRecording(true);
    }
  };

  const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const handleNext = () => {
    if (!quiz) return;
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    if (!quiz || !attemptId || isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        await new Promise<void>((resolve) => {
          if (!mediaRecorderRef.current) {
            resolve();
            return;
          }
          mediaRecorderRef.current.onstop = () => resolve();
          mediaRecorderRef.current.stop();
        });
      }

      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      if (!blob.size) {
        throw new Error('No video data was recorded. Please retry the interview.');
      }

      const formData = new FormData();
      formData.append('video', blob, `attempt_${attemptId}.webm`);
      formData.append('attempt_id', attemptId.toString());

      setSubmissionMessage('Uploading your interview video. Please keep this tab open...');
      const uploadRes = await fetchWithTimeout(
        API_ENDPOINTS.QUIZ(quizId as string) + '/submit-video',
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData
        },
        300000
      );

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        console.error("Backend AWS Error Details:", errData);
        throw new Error(errData.detail || "Video upload failed on the server.");
      }

      setSubmissionMessage('Video uploaded. Finalizing your submission...');
      const submitRes = await fetchWithTimeout(
        API_ENDPOINTS.SUBMIT_QUIZ(quizId as string, attemptId.toString()),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ answers: {}, attemptId })
        },
        60000
      );
      if (!submitRes.ok) {
        const submitErr = await submitRes.json().catch(() => ({}));
        throw new Error(submitErr.detail || 'Could not finalize interview submission.');
      }

      alert('Interview submitted successfully.');

      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Failed to upload video", err);
      const timeoutMessage = err?.name === 'AbortError'
        ? 'Upload timed out. Please check your internet and retry once.'
        : err.message || "There was an error submitting your interview. Please contact support.";
      alert(timeoutMessage);
      setSubmissionMessage('');
      setIsSubmitting(false);
    }
  };

  if (cameraError) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#ef4444' }}>{cameraError}</h2>
        {permissionHelp && <p style={{ color: '#6b7280' }}>{permissionHelp}</p>}
        <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', borderRadius: '5px', marginTop: '20px', cursor: 'pointer', border: 'none' }}>Retry Permissions</button>
        <button onClick={initCamera} style={{ padding: '10px 20px', background: '#111827', color: 'white', borderRadius: '5px', marginTop: '20px', marginLeft: '10px', cursor: 'pointer', border: 'none' }}>Check Permissions Again</button>
      </div>
    );
  }

  if (!quiz) return <div>Loading interview...</div>;

  return (
    <QuizSecurity onViolation={() => handleFinish()}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#fff', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '20px', color: '#1f2937' }}>{quiz.title} (Virtual Interview)</h1>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: timeLeft < 60 ? '#ef4444' : '#3b82f6' }}>
          Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>
      {totalTime > 0 && (
        <div style={{ marginBottom: '20px', background: '#fff', padding: '12px 16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4b5563', marginBottom: '8px' }}>
            <span>Interview progress by time</span>
            <span>{Math.floor((totalTime - timeLeft) / 60)}:{((totalTime - timeLeft) % 60).toString().padStart(2, '0')} / {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(0, ((totalTime - timeLeft) / totalTime) * 100))}%`,
                height: '100%',
                background: '#3b82f6',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', flexDirection: 'row' }}>
        {/* Left: Camera View */}
        <div style={{ flex: 1, background: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', position: 'relative' }}>
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {isRecording && (
            <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', padding: '4px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }}></span>
              RECORDING
            </div>
          )}
          <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }`}</style>
        </div>

        {/* Right: Question View */}
        <div style={{ width: '400px', background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
          
          {!isRecording ? (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Ready to begin?</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '30px' }}>Click start to begin the interview. The camera will record your session continuously until you finish.</p>
              <button 
                onClick={startRecording}
                style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                Start Interview
              </button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#6b7280', marginBottom: '10px' }}>
                Question {currentQuestion + 1} of {quiz.questions.length}
              </div>
              <h2 style={{ fontSize: '20px', color: '#111827', marginBottom: '30px', lineHeight: '1.4' }}>
                {quiz.questions[currentQuestion].text}
              </h2>
              
              <div style={{ marginTop: 'auto' }}>
                <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '15px', textAlign: 'center' }}>
                  Please answer verbally to the camera. Click below when you are ready for the next question.
                </p>
                
                <button 
                  onClick={handleNext}
                  disabled={isSubmitting}
                  style={{ width: '100%', padding: '12px', background: currentQuestion === quiz.questions.length - 1 ? '#10b981' : '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Uploading Video...' : (currentQuestion === quiz.questions.length - 1 ? 'Finish & Submit' : 'Next Question')}
                </button>
                {submissionMessage && <p style={{ marginTop: '10px', color: '#374151', fontSize: '12px', textAlign: 'center' }}>{submissionMessage}</p>}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  </QuizSecurity>
);
};

export default VideoQuizInterface;

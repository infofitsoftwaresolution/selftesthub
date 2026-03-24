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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  
  // Video Recording State
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Setup streaming
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        // init recorder
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            setRecordedChunks((prev) => [...prev, e.data]);
          }
        };
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.error("Error accessing camera: ", err);
        setCameraError("Camera and microphone permission is required to take this quiz.");
      }
    };
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
        setTimeLeft(data.duration * 60);

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
      mediaRecorderRef.current.start(1000); // chunk every second
      setIsRecording(true);
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

    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    // Wait slightly for the final chunks to be processed
    setTimeout(async () => {
      // Assemble video
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      
      try {
        // 1. Upload Video
        const formData = new FormData();
        formData.append('video', blob, `attempt_${attemptId}.webm`);
        formData.append('attempt_id', attemptId.toString());

        const uploadRes = await fetch(API_ENDPOINTS.QUIZ(quizId as string) + '/submit-video', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData
        });
        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          console.error("Backend AWS Error Details:", errData);
          throw new Error(errData.detail || "Video upload failed on the server.");
        }

        // 2. Complete the standard attempt
        await fetch(API_ENDPOINTS.SUBMIT_QUIZ(quizId as string, attemptId.toString()), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ answers: {}, attemptId }) // empty answers for video quiz
        });

        navigate('/dashboard');
      } catch (err: any) {
        console.error("Failed to upload video", err);
        alert(err.message || "There was an error submitting your interview. Please contact support.");
        setIsSubmitting(false);
      }
    }, 1000);
  };

  if (cameraError) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#ef4444' }}>{cameraError}</h2>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', borderRadius: '5px', marginTop: '20px', cursor: 'pointer', border: 'none' }}>Retry Permissions</button>
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

import { Quiz } from '../../types/quiz';

const TimerDebug: React.FC<{ 
  quiz: Quiz | null;
  startTime: Date | null;
  timeRemaining: number | null;
}> = ({ quiz, startTime, timeRemaining }) => {
  if (!quiz || !startTime) return null;

  return (
    <div className="fixed bottom-0 left-0 bg-black bg-opacity-75 text-white p-4 m-4 rounded">
      <div>Quiz Duration: {quiz.duration} minutes</div>
      <div>Start Time: {startTime.toISOString()}</div>
      <div>Current Time: {new Date().toISOString()}</div>
      <div>Time Remaining: {timeRemaining} seconds</div>
    </div>
  );
};

export default TimerDebug; 
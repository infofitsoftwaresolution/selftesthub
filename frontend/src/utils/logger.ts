const logToFile = async (message: string) => {
  try {
    const response = await fetch('http://localhost:8000/api/v1/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        message,
        timestamp: new Date().toISOString(),
        source: 'quiz-interface'
      })
    });
    
    if (!response.ok) {
      console.error('Failed to log:', await response.text());
    }
  } catch (error) {
    console.error('Failed to send log:', error);
  }
};

export const logger = {
  log: (message: string) => {
    console.log(message);
    logToFile(`[LOG] ${message}`);
  },
  error: (message: string, error?: any) => {
    console.error(message, error);
    logToFile(`[ERROR] ${message} ${error ? `- ${JSON.stringify(error)}` : ''}`);
  },
  warn: (message: string) => {
    console.warn(message);
    logToFile(`[WARN] ${message}`);
  }
}; 
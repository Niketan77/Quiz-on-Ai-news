import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Brain, Loader2, CheckCircle2, XCircle } from 'lucide-react';

// Initialize Google Generative AI with your API key
const genAI = new GoogleGenerativeAI('AIzaSyADLZB-uhyPWbNWEELeuHCZLcFaPgrRBsk');

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);

  useEffect(() => {
    generateQuestions();
  }, []);

  const generateQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Generate exactly 5 multiple choice questions about the latest artificial intelligence news, updates, and developments from the last 24 hours. Focus on recent AI announcements, product launches, research breakthroughs, or industry developments.

        Format your response as a JSON array of objects. Each object should have:
        {
          "question": "the question text about a specific recent AI news or update",
          "options": ["option 1", "option 2", "option 3", "option 4"],
          "correctAnswer": 0 // index of correct option (0-3)
        }

        Guidelines for questions:
        - Each question should be about a different recent AI news item or update
        - Include specific details like company names, product names, or research findings
        - Make questions factual and based on real recent developments
        - Ensure questions are engaging and informative
        - Keep technical terms explained clearly
        
        Ensure the JSON is valid and properly formatted.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const parsedQuestions = JSON.parse(text.replace(/```json\n?|```/g, '').trim());
        
        // Validate the response format
        if (!Array.isArray(parsedQuestions) || parsedQuestions.length !== 5) {
          throw new Error('Invalid response format: Expected array of 5 questions');
        }

        const validatedQuestions = parsedQuestions.map((q: any) => {
          if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || 
              typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
            throw new Error('Invalid question format');
          }
          return {
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer
          };
        });

        setQuestions(validatedQuestions);
        setLoading(false);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        throw new Error('Failed to parse AI response. Please try again.');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate questions. Please try again later.');
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 500);
    } else {
      setQuizComplete(true);
    }
  };

  const calculateScore = () => {
    return selectedAnswers.reduce((score, answer, index) => {
      return score + (answer === questions[index].correctAnswer ? 1 : 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500" />
          <p className="mt-4 text-gray-600">Generating your AI News quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-700">{error}</p>
          <button
            onClick={generateQuestions}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (quizComplete) {
    const score = calculateScore();
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold mt-4">Quiz Complete!</h2>
              <p className="text-xl mt-2">
                You scored {score} out of {questions.length}
              </p>
            </div>
            
            <div className="space-y-6">
              {questions.map((q, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <p className="font-medium">{q.question}</p>
                  <div className="mt-2 text-sm">
                    <p className="text-gray-600">Your answer: {q.options[selectedAnswers[index]]}</p>
                    <p className={selectedAnswers[index] === q.correctAnswer ? "text-green-600" : "text-red-600"}>
                      Correct answer: {q.options[q.correctAnswer]}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setQuestions([]);
                setSelectedAnswers([]);
                setCurrentQuestion(0);
                setQuizComplete(false);
                setLoading(true);
                generateQuestions();
              }}
              className="mt-8 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Take Another Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Brain className="w-12 h-12 text-blue-500 mx-auto" />
          <h1 className="text-2xl font-bold mt-4">Latest AI News Quiz</h1>
          <p className="text-sm text-gray-500 mt-1">Test your knowledge of recent AI developments</p>
          <p className="text-gray-600 mt-4">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 transition-all duration-300">
          <p className="text-lg font-medium mb-6">
            {questions[currentQuestion]?.question}
          </p>

          <div className="space-y-3">
            {questions[currentQuestion]?.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full p-4 text-left rounded-lg transition-colors ${
                  selectedAnswers[currentQuestion] === index
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
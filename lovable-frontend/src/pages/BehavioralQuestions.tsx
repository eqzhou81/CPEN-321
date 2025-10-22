import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Save, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { mockBehavioralQuestions, mockJobApplications } from '@/data/mockData';
import { BehavioralQuestion } from '@/types';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

const BehavioralQuestions = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const job = mockJobApplications.find(j => j.id === jobId);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<BehavioralQuestion[]>(mockBehavioralQuestions);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const currentQuestion = questions[currentIndex];
  const completedCount = questions.filter(q => q.completed).length;
  const progressPercentage = (completedCount / questions.length) * 100;

  const handleSubmitAnswer = () => {
    // Mock AI feedback
    const mockFeedback = {
      strengths: 'You clearly described the situation and provided specific examples. Good use of the STAR method structure.',
      improvements: 'Your answer was good, but missing clear measurable results. Try to quantify the positive outcome when possible.'
    };

    setQuestions(questions.map((q, idx) => 
      idx === currentIndex 
        ? { ...q, completed: true, answer: currentAnswer, feedback: mockFeedback }
        : q
    ));
    setShowFeedback(true);
    toast({ title: 'Answer submitted! Review your feedback below.' });
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer('');
      setShowFeedback(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentAnswer(questions[currentIndex - 1].answer || '');
      setShowFeedback(!!questions[currentIndex - 1].feedback);
    }
  };

  const handleSaveSession = () => {
    toast({ title: 'Mock interview session saved to your profile!' });
  };

  const handleEndSession = () => {
    navigate(`/job/${jobId}/questions`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Mock Interview Session</h1>
          <p className="text-muted-foreground mt-1">
            Answer the question below to practice your interview skills
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Session Progress: {completedCount}/{questions.length} questions complete
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Question {currentIndex + 1} of {questions.length}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-accent p-6 rounded-lg">
              <p className="text-lg italic">"{currentQuestion.question}"</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Your Answer</label>
              <Textarea
                placeholder="Type your answer here..."
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                rows={8}
                className="resize-none"
                disabled={showFeedback}
              />
            </div>

            {showFeedback && currentQuestion.feedback && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  AI Feedback
                </h3>
                
                <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
                  <h4 className="font-medium text-green-900 mb-2">✓ Strengths</h4>
                  <p className="text-sm text-green-800">{currentQuestion.feedback.strengths}</p>
                </div>

                <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded">
                  <h4 className="font-medium text-orange-900 mb-2">⚠ Areas for Improvement</h4>
                  <p className="text-sm text-orange-800">{currentQuestion.feedback.improvements}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSaveSession}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Session
                </Button>
                {!showFeedback ? (
                  <Button onClick={handleSubmitAnswer} disabled={!currentAnswer.trim()}>
                    Submit Answer
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion}>
                    {currentIndex < questions.length - 1 ? (
                      <>
                        Next Question
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      'Finish Session'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            💡 Tips: Use the STAR method (Situation, Task, Action, Result) for behavioral questions
          </p>
          <Button variant="outline" onClick={handleEndSession}>
            End Session
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BehavioralQuestions;

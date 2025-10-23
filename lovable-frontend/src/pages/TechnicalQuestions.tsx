import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ExternalLink, Mail, CheckCircle2 } from 'lucide-react';
import { mockTechnicalQuestions, mockJobApplications } from '@/data/mockData';
import { TechnicalQuestion } from '@/types';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

const TechnicalQuestions = () => {
  const { jobId } = useParams();
  const { toast } = useToast();
  const job = mockJobApplications.find(j => j.id === jobId);
  const [questions, setQuestions] = useState<TechnicalQuestion[]>(mockTechnicalQuestions);

  const handleToggleComplete = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, completed: !q.completed } : q
    ));
  };

  const handleEmailQuestion = (question: TechnicalQuestion) => {
    toast({ title: `Email sent with link to: ${question.title}` });
  };

  const handleEmailAll = () => {
    toast({ title: 'Practice set emailed successfully!' });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-orange-100 text-orange-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const completedCount = questions.filter(q => q.completed).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Technical Questions</h1>
            <p className="text-muted-foreground mt-1">
              {job?.title} at {job?.company}
            </p>
          </div>
          <Button onClick={handleEmailAll}>
            <Mail className="w-4 h-4 mr-2" />
            Email Practice Set
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progress: {completedCount}/{questions.length} completed
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="space-y-3">
          {questions.map((question) => (
            <Card key={question.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={question.completed}
                    onCheckedChange={() => handleToggleComplete(question.id)}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-primary">{question.title}</h3>
                      <Badge className={getDifficultyColor(question.difficulty)} variant="secondary">
                        {question.difficulty}
                      </Badge>
                      {question.completed && (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEmailQuestion(question)}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email Link
                    </Button>
                    <Button variant="default" size="sm" asChild>
                      <a href={question.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in LeetCode
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-sm text-muted-foreground text-center">
          💡 Tip: Click on problems to practice on LeetCode. Mark them complete as you finish!
        </p>
      </div>
    </DashboardLayout>
  );
};

export default TechnicalQuestions;

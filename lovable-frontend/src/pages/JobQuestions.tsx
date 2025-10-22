import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Brain, Code2, MapPin } from 'lucide-react';
import { mockJobApplications } from '@/data/mockData';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SimilarJobsSection from '@/components/jobs/SimilarJobsSection';

const JobQuestions = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const job = mockJobApplications.find(j => j.id === jobId);

  if (!job) {
    return <div>Job not found</div>;
  }

  const totalQuestions = 20;
  const completed = job.progress.technical + job.progress.behavioral;
  const progressPercentage = (completed / totalQuestions) * 100;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">{job.title}</h1>
          <p className="text-muted-foreground mt-1">{job.company}</p>
        </div>

        {/* Progress Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Overall Progress</CardTitle>
              <span className="text-sm text-muted-foreground">{completed}/{totalQuestions} completed</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className="h-3" />
          </CardContent>
        </Card>

        {/* Question Types */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary">Behavioral Questions</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Practice common behavioral interview questions
                </p>
                <p className="text-sm font-medium mt-3">
                  {job.progress.behavioral}/10 completed
                </p>
              </div>
              <Button 
                onClick={() => navigate(`/job/${jobId}/behavioral`)}
                className="w-full"
                size="lg"
              >
                Start Behavioral
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Code2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary">Technical Questions</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Solve coding problems and technical challenges
                </p>
                <p className="text-sm font-medium mt-3">
                  {job.progress.technical}/10 completed
                </p>
              </div>
              <Button 
                onClick={() => navigate(`/job/${jobId}/technical`)}
                className="w-full"
                size="lg"
              >
                Start Technical
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Similar Jobs Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <CardTitle>Similar Jobs Nearby</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <SimilarJobsSection jobId={jobId} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default JobQuestions;

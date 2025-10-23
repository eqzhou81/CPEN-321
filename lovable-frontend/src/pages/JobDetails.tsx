import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { jobService } from '@/services/jobService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, DollarSign, Edit, ExternalLink, MapPin, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const JobDetails = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch job details
  const { data: jobData, isLoading, error } = useQuery({
    queryKey: ['jobApplication', jobId],
    queryFn: () => jobService.getJobApplication(jobId!),
    enabled: !!jobId,
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: jobService.deleteJobApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      toast({ title: 'Job application deleted successfully' });
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete job application',
        description: error.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = async () => {
    if (!jobId) return;
    
    setIsDeleting(true);
    try {
      await deleteJobMutation.mutateAsync(jobId);
    } finally {
      setIsDeleting(false);
    }
  };

  const job = jobData?.data.jobApplication;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading job details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !job) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-destructive mb-4">Failed to load job details</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/job/${jobId}/edit`)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        {/* Job Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{job.title}</CardTitle>
                <CardDescription className="text-xl mb-4">{job.company}</CardDescription>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {job.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </div>
                  )}
                  {job.salary && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {job.salary}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Added {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              {job.url && (
                <Button asChild variant="outline">
                  <a href={job.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Original
                  </a>
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Job Type and Experience Level */}
            {(job.jobType || job.experienceLevel) && (
              <div className="flex flex-wrap gap-2">
                {job.jobType && (
                  <Badge variant="secondary" className="capitalize">
                    {job.jobType.replace('-', ' ')}
                  </Badge>
                )}
                {job.experienceLevel && (
                  <Badge variant="outline" className="capitalize">
                    {job.experienceLevel} Level
                  </Badge>
                )}
              </div>
            )}

            <Separator />

            {/* Job Description */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Job Description</h3>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {job.description}
                </p>
              </div>
            </div>

            {/* Skills and Requirements */}
            {(job.skills?.length || job.requirements?.length) && (
              <>
                <Separator />
                <div className="grid md:grid-cols-2 gap-6">
                  {job.skills?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {job.requirements?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                      <ul className="space-y-1">
                        {job.requirements.map((req, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Action Buttons */}
            <Separator />
            <div className="flex gap-4">
              <Button 
                onClick={() => navigate(`/job/${jobId}/questions`)}
                className="flex-1"
              >
                Generate Questions
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate(`/job/${jobId}/similar`)}
                className="flex-1"
              >
                Find Similar Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default JobDetails;

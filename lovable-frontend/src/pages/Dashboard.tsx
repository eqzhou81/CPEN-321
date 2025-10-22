import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { jobService } from '@/services/jobService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, DollarSign, ExternalLink, Eye, Loader2, MapPin, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pasteMode, setPasteMode] = useState<'text' | 'link'>('text');
  const [jobText, setJobText] = useState('');
  const [jobLink, setJobLink] = useState('');

  // Fetch job applications
  const { data: jobsData, isLoading, error } = useQuery({
    queryKey: ['jobApplications'],
    queryFn: () => jobService.getJobApplications(),
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: jobService.createJobApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      toast({ title: 'Job application added successfully!' });
      setJobText('');
      setJobLink('');
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add job application',
        description: error.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Scrape job mutation
  const scrapeJobMutation = useMutation({
    mutationFn: jobService.scrapeJobDetails,
    onSuccess: (data) => {
      const jobDetails = data.data.jobDetails;
      createJobMutation.mutate({
        title: jobDetails.title,
        company: jobDetails.company,
        description: jobDetails.description,
        location: jobDetails.location,
        url: jobDetails.url,
        salary: jobDetails.salary,
        jobType: jobDetails.jobType,
        experienceLevel: jobDetails.experienceLevel,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to scrape job details',
        description: error.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: jobService.deleteJobApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      toast({ title: 'Job application removed', variant: 'destructive' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete job application',
        description: error.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const parseJobText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    
    // Try to find title and company using common patterns
    let title = 'New Position';
    let company = 'Company Name';
    
    // Look for common patterns
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i].trim();
      
      // Look for job title patterns
      if (line.length > 5 && line.length < 100 && 
          (line.includes('Engineer') || line.includes('Developer') || 
           line.includes('Manager') || line.includes('Analyst') ||
           line.includes('Designer') || line.includes('Specialist') ||
           line.includes('Coordinator') || line.includes('Director'))) {
        title = line;
        continue;
      }
      
      // Look for company patterns
      if (line.length > 2 && line.length < 50 && 
          !line.includes('@') && !line.includes('http') &&
          !line.includes('Salary') && !line.includes('Location') &&
          !line.includes('Requirements') && !line.includes('Responsibilities')) {
        company = line;
        break;
      }
    }
    
    // If we didn't find a good title, use the first line
    if (title === 'New Position' && lines.length > 0) {
      title = lines[0];
    }
    
    return { title, company };
  };

  const handleAddJob = () => {
    if (pasteMode === 'text' && jobText.trim()) {
      const { title, company } = parseJobText(jobText);
      
      createJobMutation.mutate({
        title,
        company,
        description: jobText,
      });
    } else if (pasteMode === 'link' && jobLink.trim()) {
      scrapeJobMutation.mutate(jobLink);
    }
  };

  const handleDeleteJob = (id: string) => {
    deleteJobMutation.mutate(id);
  };

  const handleGenerateQuestions = (jobId: string) => {
    navigate(`/job/${jobId}/questions`);
  };

  const jobs = jobsData?.data.jobApplications || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">My Job Applications</h1>
            <p className="text-muted-foreground mt-1">Track your applications and practice interview questions</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg">
                <Plus className="w-5 h-5 mr-2" />
                Add Job Application
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add Job Application</DialogTitle>
                <DialogDescription>
                  Paste a job posting text or link to add it to your portfolio
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <Button
                    variant={pasteMode === 'text' ? 'default' : 'outline'}
                    onClick={() => setPasteMode('text')}
                    className="flex-1"
                  >
                    Paste Text
                  </Button>
                  <Button
                    variant={pasteMode === 'link' ? 'default' : 'outline'}
                    onClick={() => setPasteMode('link')}
                    className="flex-1"
                  >
                    Paste Link
                  </Button>
                </div>
                
                {pasteMode === 'text' ? (
                  <div className="space-y-2">
                    <Label htmlFor="job-text">Job Posting Text</Label>
                    <Textarea
                      id="job-text"
                      placeholder="Paste the job posting details here..."
                      value={jobText}
                      onChange={(e) => setJobText(e.target.value)}
                      rows={8}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="job-link">Job Posting URL</Label>
                    <Input
                      id="job-link"
                      placeholder="https://..."
                      value={jobLink}
                      onChange={(e) => setJobLink(e.target.value)}
                    />
                  </div>
                )}
                
                <Button 
                  onClick={handleAddJob} 
                  className="w-full"
                  disabled={createJobMutation.isPending || scrapeJobMutation.isPending}
                >
                  {(createJobMutation.isPending || scrapeJobMutation.isPending) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add to Portfolio'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load job applications</p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['jobApplications'] })} className="mt-2">
              Try Again
            </Button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No job applications yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first job application to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job._id} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigate(`/job/${job._id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">{job.title}</CardTitle>
                      <CardDescription className="text-base mt-1">{job.company}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/job/${job._id}`);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {job.url && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(job.url, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteJob(job._id);
                        }}
                        disabled={deleteJobMutation.isPending}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                  
                  {/* Job metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </div>
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
                  </div>

                  {/* Job type and experience badges */}
                  {(job.jobType || job.experienceLevel) && (
                    <div className="flex flex-wrap gap-2">
                      {job.jobType && (
                        <Badge variant="secondary" className="text-xs">
                          {job.jobType.replace('-', ' ')}
                        </Badge>
                      )}
                      {job.experienceLevel && (
                        <Badge variant="outline" className="text-xs">
                          {job.experienceLevel}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateQuestions(job._id);
                      }} 
                      className="flex-1"
                    >
                      Generate Questions
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/job/${job._id}`);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

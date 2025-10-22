import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Bookmark, MapPin } from 'lucide-react';
import { mockSimilarJobs } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

interface SimilarJobsSectionProps {
  jobId: string;
}

const SimilarJobsSection = ({ jobId }: SimilarJobsSectionProps) => {
  const { toast } = useToast();
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());

  const handleSaveJob = (jobId: string) => {
    setSavedJobs(new Set([...savedJobs, jobId]));
    toast({ title: 'Job saved to your portfolio!' });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Remote': return 'bg-green-100 text-green-800';
      case 'Hybrid': return 'bg-blue-100 text-blue-800';
      case 'On-site': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {mockSimilarJobs.map((job) => (
        <div key={job.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-semibold text-primary">{job.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{job.company}</p>
              <div className="flex items-center gap-3 mt-2 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{job.location}</span>
                </div>
                {job.distance && (
                  <span className="text-muted-foreground">{job.distance} away</span>
                )}
                <Badge className={getTypeColor(job.type)} variant="secondary">
                  {job.type}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveJob(job.id)}
                disabled={savedJobs.has(job.id)}
              >
                <Bookmark className={`w-4 h-4 ${savedJobs.has(job.id) ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={job.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SimilarJobsSection;

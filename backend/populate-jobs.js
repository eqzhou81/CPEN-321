const mongoose = require('mongoose');
const { availableJobModel } = require('./dist/models/availableJob.model');

// Sample Amazon and Microsoft Vancouver software jobs
const sampleJobs = [
  // Amazon Vancouver Jobs (10)
  {
    title: "Software Development Engineer",
    company: "Amazon",
    description: "Join our team to build scalable, distributed systems that power Amazon's e-commerce platform. You'll work on cutting-edge technologies and solve complex problems at scale.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://amazon.jobs/en/jobs/12345678/software-development-engineer",
    salary: "$120,000 - $180,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["Java", "Python", "AWS", "Distributed Systems", "Microservices"],
    requirements: ["Bachelor's degree in Computer Science", "3+ years software development experience", "Experience with cloud platforms"],
    isRemote: false,
  },
  {
    title: "Senior Software Engineer - Alexa",
    company: "Amazon",
    description: "Help build the future of voice technology with Alexa. Work on natural language processing, machine learning, and voice user interfaces.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://amazon.jobs/en/jobs/12345679/senior-software-engineer-alexa",
    salary: "$140,000 - $200,000 CAD",
    jobType: "full-time",
    experienceLevel: "senior",
    skills: ["Python", "Machine Learning", "NLP", "TensorFlow", "AWS"],
    requirements: ["Master's degree in Computer Science or related field", "5+ years software development experience", "Experience with ML/AI"],
    isRemote: false,
  },
  {
    title: "Frontend Developer - Amazon Web Services",
    company: "Amazon",
    description: "Build intuitive user interfaces for AWS services. Work with React, TypeScript, and modern web technologies to create exceptional user experiences.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://amazon.jobs/en/jobs/12345680/frontend-developer-aws",
    salary: "$110,000 - $160,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["React", "TypeScript", "JavaScript", "CSS", "AWS"],
    requirements: ["Bachelor's degree in Computer Science", "3+ years frontend development", "Experience with React ecosystem"],
    isRemote: false,
  },
  {
    title: "Backend Software Engineer - Prime Video",
    company: "Amazon",
    description: "Develop backend services for Prime Video streaming platform. Work on video processing, content delivery, and recommendation systems.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://amazon.jobs/en/jobs/12345681/backend-engineer-prime-video",
    salary: "$125,000 - $175,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["Java", "Spring Boot", "Microservices", "Docker", "Kubernetes"],
    requirements: ["Bachelor's degree in Computer Science", "4+ years backend development", "Experience with microservices architecture"],
    isRemote: false,
  },
  {
    title: "DevOps Engineer - Amazon Games",
    company: "Amazon",
    description: "Build and maintain infrastructure for Amazon's gaming services. Work with CI/CD pipelines, monitoring, and cloud infrastructure.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://amazon.jobs/en/jobs/12345682/devops-engineer-amazon-games",
    salary: "$130,000 - $185,000 CAD",
    jobType: "full-time",
    experienceLevel: "senior",
    skills: ["AWS", "Docker", "Kubernetes", "Terraform", "Python"],
    requirements: ["Bachelor's degree in Computer Science", "5+ years DevOps experience", "Strong AWS knowledge"],
    isRemote: false,
  },
  {
    title: "Mobile App Developer - Amazon Shopping",
    company: "Amazon",
    description: "Develop mobile applications for Amazon's shopping experience. Work with React Native, iOS, and Android platforms.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://amazon.jobs/en/jobs/12345683/mobile-developer-shopping",
    salary: "$115,000 - $165,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["React Native", "iOS", "Android", "JavaScript", "Mobile Development"],
    requirements: ["Bachelor's degree in Computer Science", "3+ years mobile development", "Experience with React Native"],
    isRemote: false,
  },
  {
    title: "Data Engineer - Amazon Analytics",
    company: "Amazon",
    description: "Build data pipelines and analytics systems for Amazon's business intelligence. Work with big data technologies and machine learning.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://amazon.jobs/en/jobs/12345684/data-engineer-analytics",
    salary: "$135,000 - $190,000 CAD",
    jobType: "full-time",
    experienceLevel: "senior",
    skills: ["Python", "Spark", "Hadoop", "SQL", "Machine Learning"],
    requirements: ["Master's degree in Computer Science or Data Science", "5+ years data engineering experience", "Experience with big data technologies"],
    isRemote: false,
  },
  {
    title: "Full Stack Developer - Amazon Pay",
    company: "Amazon",
    description: "Develop payment processing systems and user interfaces. Work with secure payment technologies and financial systems.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://amazon.jobs/en/jobs/12345685/full-stack-developer-pay",
    salary: "$120,000 - $170,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["Java", "React", "Spring Boot", "PostgreSQL", "Security"],
    requirements: ["Bachelor's degree in Computer Science", "4+ years full-stack development", "Experience with financial systems"],
    isRemote: false,
  },
  {
    title: "Software Engineer - Amazon Fresh",
    company: "Amazon",
    description: "Build systems for Amazon's grocery delivery service. Work on logistics, inventory management, and customer experience.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://amazon.jobs/en/jobs/12345686/software-engineer-fresh",
    salary: "$125,000 - $175,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["Java", "Python", "Microservices", "AWS", "Logistics"],
    requirements: ["Bachelor's degree in Computer Science", "3+ years software development", "Experience with logistics systems"],
    isRemote: false,
  },
  {
    title: "Cloud Solutions Architect - AWS",
    company: "Amazon",
    description: "Design and implement cloud solutions for enterprise customers. Work with AWS services and help customers migrate to the cloud.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://amazon.jobs/en/jobs/12345687/cloud-solutions-architect",
    salary: "$150,000 - $220,000 CAD",
    jobType: "full-time",
    experienceLevel: "senior",
    skills: ["AWS", "Cloud Architecture", "Python", "Terraform", "Docker"],
    requirements: ["Bachelor's degree in Computer Science", "7+ years software development", "AWS certifications preferred"],
    isRemote: false,
  },

  // Microsoft Vancouver Jobs (10)
  {
    title: "Software Engineer - Microsoft Teams",
    company: "Microsoft",
    description: "Develop features for Microsoft Teams collaboration platform. Work on real-time communication, video calling, and productivity tools.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345688/software-engineer-teams",
    salary: "$130,000 - $190,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["C#", "TypeScript", "React", "Azure", "WebRTC"],
    requirements: ["Bachelor's degree in Computer Science", "4+ years software development", "Experience with real-time systems"],
    isRemote: false,
  },
  {
    title: "Senior Software Engineer - Azure",
    company: "Microsoft",
    description: "Build cloud infrastructure and services for Azure platform. Work on distributed systems, containerization, and cloud-native applications.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345689/senior-software-engineer-azure",
    salary: "$145,000 - $210,000 CAD",
    jobType: "full-time",
    experienceLevel: "senior",
    skills: ["C#", "Go", "Kubernetes", "Docker", "Azure"],
    requirements: ["Master's degree in Computer Science", "6+ years software development", "Experience with cloud platforms"],
    isRemote: false,
  },
  {
    title: "Frontend Developer - Microsoft 365",
    company: "Microsoft",
    description: "Create user interfaces for Microsoft 365 productivity suite. Work with modern web technologies and accessibility standards.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345690/frontend-developer-365",
    salary: "$115,000 - $165,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["TypeScript", "React", "CSS", "Accessibility", "Web Standards"],
    requirements: ["Bachelor's degree in Computer Science", "3+ years frontend development", "Experience with accessibility"],
    isRemote: false,
  },
  {
    title: "Backend Developer - Xbox",
    company: "Microsoft",
    description: "Develop backend services for Xbox gaming platform. Work on multiplayer systems, game analytics, and social features.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345691/backend-developer-xbox",
    salary: "$125,000 - $180,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["C#", "ASP.NET", "SQL Server", "Redis", "Gaming"],
    requirements: ["Bachelor's degree in Computer Science", "4+ years backend development", "Interest in gaming industry"],
    isRemote: false,
  },
  {
    title: "DevOps Engineer - Microsoft Security",
    company: "Microsoft",
    description: "Build and maintain infrastructure for Microsoft's security products. Work with CI/CD, monitoring, and security compliance.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345692/devops-engineer-security",
    salary: "$135,000 - $195,000 CAD",
    jobType: "full-time",
    experienceLevel: "senior",
    skills: ["Azure", "PowerShell", "Terraform", "Security", "Compliance"],
    requirements: ["Bachelor's degree in Computer Science", "5+ years DevOps experience", "Security certifications preferred"],
    isRemote: false,
  },
  {
    title: "Mobile Developer - Microsoft Office",
    company: "Microsoft",
    description: "Develop mobile applications for Microsoft Office suite. Work with iOS, Android, and cross-platform technologies.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345693/mobile-developer-office",
    salary: "$120,000 - $175,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["Swift", "Kotlin", "React Native", "iOS", "Android"],
    requirements: ["Bachelor's degree in Computer Science", "4+ years mobile development", "Experience with both iOS and Android"],
    isRemote: false,
  },
  {
    title: "Data Scientist - Microsoft Research",
    company: "Microsoft",
    description: "Apply machine learning and data science to solve complex problems. Work on research projects and product development.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345694/data-scientist-research",
    salary: "$140,000 - $200,000 CAD",
    jobType: "full-time",
    experienceLevel: "senior",
    skills: ["Python", "Machine Learning", "TensorFlow", "PyTorch", "Statistics"],
    requirements: ["PhD in Computer Science or related field", "3+ years ML experience", "Research publication record"],
    isRemote: false,
  },
  {
    title: "Full Stack Developer - Microsoft Dynamics",
    company: "Microsoft",
    description: "Develop business applications and CRM systems. Work with enterprise software and business process automation.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345695/full-stack-developer-dynamics",
    salary: "$125,000 - $180,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["C#", "JavaScript", "SQL Server", "Power Platform", "Business Logic"],
    requirements: ["Bachelor's degree in Computer Science", "4+ years full-stack development", "Experience with enterprise software"],
    isRemote: false,
  },
  {
    title: "Software Engineer - Microsoft Edge",
    company: "Microsoft",
    description: "Develop features for Microsoft Edge browser. Work on web standards, performance optimization, and user experience.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345696/software-engineer-edge",
    salary: "$130,000 - $185,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["C++", "JavaScript", "Web Standards", "Performance", "Browser Development"],
    requirements: ["Bachelor's degree in Computer Science", "4+ years software development", "Experience with browser engines"],
    isRemote: false,
  },
  {
    title: "Cloud Solutions Engineer - Microsoft Consulting",
    company: "Microsoft",
    description: "Help enterprise customers implement cloud solutions. Work with Azure services and provide technical consulting.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345697/cloud-solutions-engineer",
    salary: "$145,000 - $210,000 CAD",
    jobType: "full-time",
    experienceLevel: "senior",
    skills: ["Azure", "Cloud Architecture", "Consulting", "PowerShell", "DevOps"],
    requirements: ["Bachelor's degree in Computer Science", "6+ years software development", "Azure certifications required"],
    isRemote: false,
  },
];

async function populateDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/cpen321');
    console.log('Connected to MongoDB');

    // Clear existing jobs
    await availableJobModel.clearAll();
    console.log('Cleared existing jobs');

    // Insert sample jobs
    for (const jobData of sampleJobs) {
      await availableJobModel.create(jobData);
    }

    console.log(`Successfully populated database with ${sampleJobs.length} jobs`);
    
    // Verify the data
    const count = await availableJobModel.count();
    console.log(`Total jobs in database: ${count}`);

    // Show some sample data
    const amazonJobs = await availableJobModel.findByCompany('Amazon');
    const microsoftJobs = await availableJobModel.findByCompany('Microsoft');
    
    console.log(`Amazon jobs: ${amazonJobs.length}`);
    console.log(`Microsoft jobs: ${microsoftJobs.length}`);

  } catch (error) {
    console.error('Error populating database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
populateDatabase();
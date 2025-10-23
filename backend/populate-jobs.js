const mongoose = require('mongoose');
const { availableJobModel } = require('./dist/models/availableJob.model');

// Sample jobs data - 20 jobs (10 Amazon, 10 Microsoft) all in Vancouver
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
    title: "Senior Software Engineer",
    company: "Amazon",
    description: "Lead the development of next-generation e-commerce solutions. Work with cross-functional teams to deliver high-impact features.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://amazon.jobs/en/jobs/12345679/senior-software-engineer",
    salary: "$150,000 - $220,000 CAD",
    jobType: "full-time",
    experienceLevel: "senior",
    skills: ["Java", "Spring Boot", "React", "AWS", "Docker"],
    requirements: ["Bachelor's degree in Computer Science", "5+ years software development experience", "Leadership experience"],
    isRemote: false,
  },
  {
    title: "Frontend Developer",
    company: "Amazon",
    description: "Create intuitive user interfaces for Amazon's customer-facing applications. Work with modern frontend technologies.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://amazon.jobs/en/jobs/12345680/frontend-developer",
    salary: "$100,000 - $150,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["React", "TypeScript", "CSS", "JavaScript", "Webpack"],
    requirements: ["Bachelor's degree in Computer Science", "2+ years frontend development", "Experience with React"],
    isRemote: false,
  },
  {
    title: "Backend Developer",
    company: "Amazon",
    description: "Build robust backend services using microservices architecture. Focus on scalability and performance.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://amazon.jobs/en/jobs/12345681/backend-developer",
    salary: "$110,000 - $160,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["Java", "Spring", "MySQL", "Redis", "Kafka"],
    requirements: ["Bachelor's degree in Computer Science", "3+ years backend development", "Database experience"],
    isRemote: false,
  },
  {
    title: "Full Stack Developer",
    company: "Amazon",
    description: "Work on both frontend and backend components of Amazon's web applications. End-to-end feature development.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://amazon.jobs/en/jobs/12345682/full-stack-developer",
    salary: "$115,000 - $170,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["React", "Node.js", "Java", "AWS", "MongoDB"],
    requirements: ["Bachelor's degree in Computer Science", "3+ years full-stack development", "Cloud experience"],
    isRemote: false,
  },
  {
    title: "DevOps Engineer",
    company: "Amazon",
    description: "Manage infrastructure and deployment pipelines for Amazon's services. Focus on automation and reliability.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://amazon.jobs/en/jobs/12345683/devops-engineer",
    salary: "$130,000 - $190,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["AWS", "Docker", "Kubernetes", "Terraform", "Jenkins"],
    requirements: ["Bachelor's degree in Computer Science", "3+ years DevOps experience", "AWS certification preferred"],
    isRemote: false,
  },
  {
    title: "Data Engineer",
    company: "Amazon",
    description: "Build data pipelines and analytics platforms. Work with big data technologies to process Amazon's massive datasets.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://amazon.jobs/en/jobs/12345684/data-engineer",
    salary: "$125,000 - $185,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["Python", "Spark", "Hadoop", "AWS", "SQL"],
    requirements: ["Bachelor's degree in Computer Science", "3+ years data engineering", "Big data experience"],
    isRemote: false,
  },
  {
    title: "Machine Learning Engineer",
    company: "Amazon",
    description: "Develop ML models and algorithms for Amazon's recommendation systems and personalization features.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://amazon.jobs/en/jobs/12345685/machine-learning-engineer",
    salary: "$140,000 - $200,000 CAD",
    jobType: "full-time",
    experienceLevel: "senior",
    skills: ["Python", "TensorFlow", "PyTorch", "AWS", "MLOps"],
    requirements: ["Master's degree in Computer Science", "4+ years ML experience", "Deep learning expertise"],
    isRemote: false,
  },
  {
    title: "Mobile Developer",
    company: "Amazon",
    description: "Develop mobile applications for iOS and Android platforms. Work on Amazon's mobile shopping experience.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://amazon.jobs/en/jobs/12345686/mobile-developer",
    salary: "$110,000 - $165,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["React Native", "iOS", "Android", "JavaScript", "Swift"],
    requirements: ["Bachelor's degree in Computer Science", "3+ years mobile development", "Cross-platform experience"],
    isRemote: false,
  },
  {
    title: "Software Engineer Intern",
    company: "Amazon",
    description: "Summer internship program for students to gain hands-on experience with Amazon's development teams.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://amazon.jobs/en/jobs/12345687/software-engineer-intern",
    salary: "$6,000 - $8,000 CAD/month",
    jobType: "internship",
    experienceLevel: "entry",
    skills: ["Java", "Python", "AWS", "Git", "Agile"],
    requirements: ["Currently enrolled in Computer Science program", "Strong programming fundamentals", "Passion for technology"],
    isRemote: false,
  },

  // Microsoft Vancouver Jobs (10)
  {
    title: "Software Engineer",
    company: "Microsoft",
    description: "Join Microsoft's Vancouver team to build innovative software solutions. Work on cutting-edge technologies and products.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345688/software-engineer",
    salary: "$125,000 - $185,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["C#", ".NET", "Azure", "SQL Server", "Visual Studio"],
    requirements: ["Bachelor's degree in Computer Science", "3+ years software development", "Microsoft technologies experience"],
    isRemote: false,
  },
  {
    title: "Senior Software Engineer",
    company: "Microsoft",
    description: "Lead technical initiatives and mentor junior developers. Drive architecture decisions for Microsoft's products.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345689/senior-software-engineer",
    salary: "$160,000 - $230,000 CAD",
    jobType: "full-time",
    experienceLevel: "senior",
    skills: ["C#", ".NET Core", "Azure", "Microservices", "Leadership"],
    requirements: ["Bachelor's degree in Computer Science", "6+ years software development", "Technical leadership experience"],
    isRemote: false,
  },
  {
    title: "Frontend Developer",
    company: "Microsoft",
    description: "Create engaging user experiences for Microsoft's web applications. Work with modern frontend frameworks.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345690/frontend-developer",
    salary: "$105,000 - $155,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["React", "TypeScript", "CSS", "JavaScript", "Azure"],
    requirements: ["Bachelor's degree in Computer Science", "2+ years frontend development", "React experience"],
    isRemote: false,
  },
  {
    title: "Backend Developer",
    company: "Microsoft",
    description: "Build scalable backend services using Microsoft's cloud platform. Focus on performance and reliability.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345691/backend-developer",
    salary: "$115,000 - $170,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["C#", ".NET", "Azure", "SQL Server", "REST APIs"],
    requirements: ["Bachelor's degree in Computer Science", "3+ years backend development", "Cloud experience"],
    isRemote: false,
  },
  {
    title: "Full Stack Developer",
    company: "Microsoft",
    description: "Develop end-to-end features for Microsoft's applications. Work across the entire technology stack.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345692/full-stack-developer",
    salary: "$120,000 - $175,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["React", "C#", ".NET", "Azure", "SQL Server"],
    requirements: ["Bachelor's degree in Computer Science", "3+ years full-stack development", "Microsoft stack experience"],
    isRemote: false,
  },
  {
    title: "Cloud Engineer",
    company: "Microsoft",
    description: "Design and implement cloud solutions using Microsoft Azure. Focus on scalability and security.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345693/cloud-engineer",
    salary: "$135,000 - $195,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["Azure", "PowerShell", "ARM Templates", "DevOps", "Security"],
    requirements: ["Bachelor's degree in Computer Science", "3+ years cloud experience", "Azure certification preferred"],
    isRemote: false,
  },
  {
    title: "Data Engineer",
    company: "Microsoft",
    description: "Build data processing pipelines using Microsoft's data platform. Work with big data and analytics.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345694/data-engineer",
    salary: "$130,000 - $190,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["Python", "Azure Data Factory", "SQL Server", "Power BI", "Spark"],
    requirements: ["Bachelor's degree in Computer Science", "3+ years data engineering", "Microsoft data platform experience"],
    isRemote: false,
  },
  {
    title: "AI Engineer",
    company: "Microsoft",
    description: "Develop AI solutions using Microsoft's AI platform. Work on machine learning models and cognitive services.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345695/ai-engineer",
    salary: "$145,000 - $210,000 CAD",
    jobType: "full-time",
    experienceLevel: "senior",
    skills: ["Python", "Azure AI", "Machine Learning", "Cognitive Services", "MLOps"],
    requirements: ["Master's degree in Computer Science", "4+ years AI/ML experience", "Microsoft AI platform experience"],
    isRemote: false,
  },
  {
    title: "Mobile Developer",
    company: "Microsoft",
    description: "Develop mobile applications for iOS and Android. Work on Microsoft's mobile productivity suite.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345696/mobile-developer",
    salary: "$115,000 - $170,000 CAD",
    jobType: "full-time",
    experienceLevel: "mid",
    skills: ["Xamarin", "C#", "iOS", "Android", "Azure"],
    requirements: ["Bachelor's degree in Computer Science", "3+ years mobile development", "Cross-platform experience"],
    isRemote: false,
  },
  {
    title: "Software Engineer Intern",
    company: "Microsoft",
    description: "Summer internship program for students to work on real Microsoft projects and gain industry experience.",
    jobLocation: "Vancouver, BC, Canada",
    url: "https://careers.microsoft.com/us/en/job/12345697/software-engineer-intern",
    salary: "$6,500 - $8,500 CAD/month",
    jobType: "internship",
    experienceLevel: "entry",
    skills: ["C#", "Python", "Azure", "Git", "Agile"],
    requirements: ["Currently enrolled in Computer Science program", "Strong programming fundamentals", "Interest in Microsoft technologies"],
    isRemote: false,
  },
];

async function populateJobs() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/cpen321');
    console.log('✅ Connected to MongoDB');

    console.log('🗑️ Clearing existing available jobs...');
    await availableJobModel.clearAll();
    console.log('✅ Cleared existing jobs');

    console.log('📝 Inserting sample jobs...');
    for (const job of sampleJobs) {
      await availableJobModel.create(job);
    }
    console.log('✅ Inserted all sample jobs');

    const count = await availableJobModel.count();
    console.log(`📊 Total available jobs in database: ${count}`);

    console.log('🎉 Database population completed successfully!');
  } catch (error) {
    console.error('❌ Error populating database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the population script
populateJobs();

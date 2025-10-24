const mongoose = require('mongoose');

// Connect to MongoDB
const mongoUri = 'mongodb://localhost:27017/cpen321';

async function cleanupMockJobs() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const jobApplicationsCollection = db.collection('jobapplications');

    // Find all mock interview practice sessions
    const mockJobs = await jobApplicationsCollection.find({
      title: "Mock Interview Practice Session",
      company: "Practice Company"
    }).toArray();

    console.log(`Found ${mockJobs.length} mock interview practice sessions`);

    if (mockJobs.length > 0) {
      // Delete all mock interview practice sessions
      const result = await jobApplicationsCollection.deleteMany({
        title: "Mock Interview Practice Session",
        company: "Practice Company"
      });

      console.log(`✅ Deleted ${result.deletedCount} mock interview practice sessions`);
    }

    // Show remaining job applications
    const remainingJobs = await jobApplicationsCollection.find({}).toArray();
    console.log(`\nRemaining job applications (${remainingJobs.length}):`);
    remainingJobs.forEach(job => {
      console.log(`- ${job.title} at ${job.company} (${job.location || 'No location'})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

cleanupMockJobs();

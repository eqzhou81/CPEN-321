// Global teardown file to handle cleanup after all tests complete
export default async function teardown() {
  // Clean up any remaining timers or handles
  
  // Force close any remaining processes
  if (global.gc) {
    global.gc();
  }
  
  // Give a small delay to allow any cleanup to complete
  await new Promise(resolve => setTimeout(resolve, 100));
}
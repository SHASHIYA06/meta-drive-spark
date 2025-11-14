const { v4: uuidv4 } = require('uuid');

class JobManager {
  constructor() {
    this.jobs = new Map();
  }

  createJob(type, fileName) {
    const id = uuidv4();
    const job = {
      id,
      type,
      fileName,
      status: 'processing',
      progress: 0,
      message: 'Starting...',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.jobs.set(id, job);
    return id;
  }

  updateJob(id, updates) {
    const job = this.jobs.get(id);
    if (!job) return false;
    
    Object.assign(job, updates, { updatedAt: Date.now() });
    this.jobs.set(id, job);
    return true;
  }

  getJob(id) {
    return this.jobs.get(id);
  }

  completeJob(id, result) {
    this.updateJob(id, {
      status: 'completed',
      progress: 100,
      message: 'Completed successfully',
      result
    });
  }

  failJob(id, error) {
    this.updateJob(id, {
      status: 'failed',
      message: error.message || 'Job failed',
      error: error.toString()
    });
  }

  cleanOldJobs(maxAge = 3600000) { // 1 hour
    const now = Date.now();
    for (const [id, job] of this.jobs.entries()) {
      if (now - job.updatedAt > maxAge) {
        this.jobs.delete(id);
      }
    }
  }
}

module.exports = JobManager;

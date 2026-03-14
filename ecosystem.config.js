import dotenv from 'dotenv';

dotenv.config();

export default {
  apps: [
    {
      name: "consumer worker",
      script: "./services/workers/submissionWorker.js",
      instances: process.env.WORKER_COUNT || 2,
      exec_mode: "cluster",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

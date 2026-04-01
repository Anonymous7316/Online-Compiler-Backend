# CodeCompilerExpress

A scalable online code execution platform that allows users to submit code in multiple programming languages and have it executed in isolated Docker containers.

## Table of Contents

- [What is CodeCompilerExpress?](#what-is-codecompilerexpress)
- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [How It Works](#how-it-works)
- [Adding New Features](#adding-new-features)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## What is CodeCompilerExpress?

CodeCompilerExpress is an online code execution platform (similar to Judge0 or LeetCode) that:

- Accepts code submissions in multiple programming languages
- Executes code in isolated Docker containers for security
- Uses a queue-based asynchronous architecture for scalability
- Stores code in Pastebin and metadata in MSSQL database
- Supports 6 languages: Python, JavaScript, Java, C++, Ruby, Go

### Use Cases

- Online coding assessments
- Code playground/interactive tutorials
- Automated code testing platforms
- Educational platforms for coding exercises

---

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Express   │────▶│   MSSQL     │     │   Redis     │
│   Server    │     │  Database   │     │   (Queue)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       ▼                                       ▼
┌─────────────┐                         ┌─────────────┐
│  Pastebin   │                         │   Worker    │
│  (Storage)  │                         │  (PM2)      │
└─────────────┘                         └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   Docker    │
                                        │ Containers  │
                                        └─────────────┘
```

### Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| Web Server | Express.js | REST API handling |
| Database | MSSQL | Metadata & status storage |
| Queue | BullMQ + Redis | Job processing |
| Storage | Pastebin API | Code storage |
| Execution | Docker | Isolated code execution |
| Process Manager | PM2 | Worker process management |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Docker Desktop (running)
- MSSQL Server
- Redis Server
- Pastebin Account (for code storage)

### Installation

```bash
# Clone the repository
cd codeCompilerExpress

# Install dependencies
npm install

# Create .env file (see Configuration section)
cp .env.example .env
# Edit .env with your credentials

# Start the server
npm run dev

# In a separate terminal, start the worker
node services/workers/submissionWorker.js
```

### Test the API

```bash
# Submit code
curl -X POST http://localhost:3000/api/v1/submission \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id": "0192d0e1-7c80-7d39-9abc-9def01234567",
    "code": "print(\"Hello, World!\")",
    "language": "python"
  }'

# Check status
curl http://localhost:3000/api/v1/submission/0192d0e1-7c80-7d39-9abc-9def01234567
```

---

## Project Structure

```
codeCompilerExpress/
├── app.js                      # Express app configuration
├── server.js                   # Main entry point
├── ecosystem.config.js         # PM2 configuration
├── package.json                # Dependencies
│
├── config/
│   └── database/
│       ├── databaseConfig.js  # Factory for DB instances
│       ├── dbAbstract.js       # Abstract base class
│       └── sqlDB.js            # MSSQL implementation
│
├── controllers/
│   ├── auth.controller.js      # Authentication (stubbed)
│   └── submission.controller.js # Submission handling
│
├── middlewares/
│   ├── error.middleware.js     # Global error handling
│   ├── logging.middleware.js  # Request logging
│   └── submission.middleware.js # Joi validation
│
├── routes/
│   ├── auth.route.js           # Auth routes
│   ├── ping.route.js           # Health check
│   └── submission.route.js     # Submission routes
│
├── schemas/
│   ├── submission.schema.js    # Submission validation
│   └── status.schema.js        # Status validation
│
└── services/
    ├── cache/                  # Caching (placeholder)
    │   ├── chacheStorage.js
    │   ├── RedisCache.js
    │   └── valkeyCache.js
    │
    ├── container/              # Docker execution
    │   ├── containerConfig.js  # Language configs
    │   ├── containerManager.js # Abstract base
    │   └── docker.service.js   # Docker implementation
    │
    ├── queue/                  # Job queue
    │   ├── queueConfig.js      # Factory for queues
    │   ├── queueManager.js     # Abstract interfaces
    │   └── bullmqManager.js    # BullMQ implementation
    │
    ├── storage/                # Code storage
    │   ├── storageConfig.js    # Factory for storage
    │   ├── storageManager.js   # Abstract base
    │   └── pastebinManager.js  # Pastebin implementation
    │
    └── workers/
        └── submissionWorker.js # Queue worker process
```

### Folder Purpose Guide

| Folder | When to Modify |
|--------|----------------|
| `controllers/` | When changing API logic |
| `routes/` | When adding new endpoints |
| `middlewares/` | When adding request processing |
| `schemas/` | When changing validation rules |
| `services/queue/` | When changing job processing |
| `services/container/` | When adding new languages or changing execution |
| `services/storage/` | When changing how code is stored |
| `config/database/` | When changing database operations |

---

## Configuration

Create a `.env` file in the root directory:

```env
# ===================
# Server Configuration
# ===================
PORT=3000

# ===================
# Database (MSSQL)
# ===================
DB_TYPE=mssql
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_SERVER_NAME=localhost
DB_NAME=CodeCompilerDB

# ===================
# Queue (BullMQ + Redis)
# ===================
QUEUE_TYPE=bullmq
REDIS_HOST=localhost
REDIS_PORT=6379

# ===================
# Storage (Pastebin)
# ===================
STORAGE_TYPE=pastebin
PASTEBIN_API_KEY=your_api_key
PASTEBIN_USERNAME=your_username
PASTEBIN_PASSWORD=your_password

# ===================
# Worker Configuration
# ===================
PROCESS_COUNT=1
```

### Database Setup

Run these SQL commands to create required tables:

```sql
-- Create SubmissionDB table
CREATE TABLE dbo.SubmissionDB (
    submission_id NVARCHAR(255) PRIMARY KEY,
    submission_date DATETIME NOT NULL,
    code_language NVARCHAR(50) NOT NULL,
    code NVARCHAR(MAX) NOT NULL
);

-- Create StatusDB table
CREATE TABLE dbo.StatusDB (
    submission_id NVARCHAR(255) PRIMARY KEY,
    status NVARCHAR(50) NOT NULL,
    FOREIGN KEY (submission_id) REFERENCES SubmissionDB(submission_id)
);
```

---

## API Endpoints

### Health Check
```
GET /api/v1/ping
```
Returns: `{ message: "pong" }`

### Submit Code
```
POST /api/v1/submission
Content-Type: application/json

{
  "submission_id": "0192d0e1-7c80-7d39-9abc-9def01234567",
  "code": "print('Hello')",
  "language": "python"
}
```
Returns: `{ submission_id, status: "success", message: "Submission added to queue" }`

### Get Submission Status
```
GET /api/v1/submission/:id
```
Returns: `{ submission_id, status: "NEW|RUNNING|COMPLETED|ERROR" }`

### Authentication (Stubbed)
```
POST /api/v1/auth/login
POST /api/v1/auth/register
```

---

## How It Works

### Complete Data Flow

```
1. Client submits code
   │
   ├─▶ Validate request (Joi middleware)
   │
   ├─▶ Save code to Pastebin → get URL
   │
   ├─▶ Insert into MSSQL (transaction)
   │   - SubmissionDB: submission_id, date, language, code (URL)
   │   - StatusDB: status = "NEW"
   │
   ├─▶ Push submission_id to BullMQ queue
   │
   └─▶ Return 201: { submission_id, status: "success" }


2. Worker picks up job (async)
   │
   ├─▶ Update status to "RUNNING"
   │
   ├─▶ Fetch code from Pastebin
   │
   ├─▶ Create Docker container (language-specific image)
   │
   ├─▶ Write code to /code/ directory (base64 encoded)
   │
   ├─▶ Execute code (30 second timeout)
   │
   ├─▶ Capture output
   │
   ├─▶ Update status to "COMPLETED" or "ERROR"
   │
   └─▶ Clean up container


3. Client polls for result
   │
   └─▶ GET /api/v1/submission/:id
       │
       └─▶ Query StatusDB → return status
```

### Supported Languages

| Language | Docker Image | Execution Command |
|----------|-------------|-------------------|
| Python | `python:latest` | `python3 filename.py` |
| JavaScript | `node:slim` | `node filename.js` |
| Java | `openjdk:27-ea-oraclelinux9` | `javac filename.java && java filename` |
| C++ | `gcc:latest` | `g++ filename.cpp -o output && ./output` |
| Ruby | `ruby:latest` | `ruby filename.rb` |
| Go | `golang:latest` | `go run filename.go` |

---

## Adding New Features

### Adding a New Language

1. **Update `containerConfig.js`**:
   ```javascript
   export const containerImages = {
     // ...existing languages
     rust: "rust:latest",
   };

   export const fileExtensions = {
     // ...existing extensions
     rust: "rs",
   };

   export const executionCommands = {
     // ...existing commands
     rust: (filename) => `rustc ${filename} && ./${filename.replace('.rs', '')}`,
   };
   ```

2. **Update validation schema** in `schemas/submission.schema.js`:
   ```javascript
   language: joi.string().valid('python', 'javascript', 'java', 'cpp', 'ruby', 'go', 'rust').required()
   ```

### Adding a New Storage Provider

1. Create new file in `services/storage/`
2. Extend `StorageManager` abstract class
3. Add to factory in `services/storage/storageConfig.js`:
   ```javascript
   export const StorageService = {
     pastebin: () => new PastebinManager(),
     s3: () => new S3Manager(),  // Add new provider
   };
   ```

### Adding a New Queue System

1. Create new file in `services/queue/`
2. Implement `QueuePublisher`, `QueueConsumer`, `QueueSubmissionService` interfaces
3. Add to factory in `services/queue/queueConfig.js`

### Adding New API Endpoints

1. Add route in appropriate file in `routes/`
2. Add controller function in `controllers/`
3. Add validation if needed in `schemas/`
4. Register middleware if needed in `middlewares/`

---

## Best Practices

### 1. Always Use Environment Variables

Never hardcode credentials or configuration. Use `.env` files:

```javascript
// ✅ Good
const port = process.env.PORT;

// ❌ Bad
const port = 3000;
```

### 2. Use Async/Await Consistently

```javascript
// ✅ Good
async function submitCode(req, res) {
  try {
    const result = await DB.addToDB(data);
    return result;
  } catch (error) {
    console.error(error);
  }
}

// ❌ Bad (mixed patterns)
function submitCode(req, res) {
  DB.addToDB(data)
    .then(result => res.json(result))
    .catch(error => console.error(error));
}
```

### 3. Validate All Input

Always validate incoming data using Joi schemas:

```javascript
// ✅ Good
const { error } = submissionSchema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.details[0].message });
}

// ❌ Bad
const { code, language } = req.body; // No validation
```

### 4. Handle Errors Properly

```javascript
// ✅ Good - with cleanup
try {
  const fileURL = await storageService.saveCode(submission_id, code, language);
  // ... rest of logic
} catch (err) {
  if (fileURL) {
    await storageService.deleteFile(fileURL); // Cleanup on error
  }
  throw err;
}

// ❌ Bad - no cleanup
try {
  await storageService.saveCode(submission_id, code, language);
  throw new Error("Something failed");
} catch (err) {
  // fileURL is never cleaned up
}
```

### 5. Use Transactions for Atomic Operations

```javascript
// ✅ Good
const dbResult = await DB.addToDB(submissionData);
try {
  await enqueueSubmission({ submission_id });
  await dbResult.commit();
} catch (err) {
  await dbResult.rollback();
  throw err;
}
```

### 6. Clean Up Resources

Always clean up Docker containers, files, etc.:

```javascript
// ✅ Good
try {
  const result = await dockerService.executeCode(code, language, submission_id);
  return result;
} finally {
  // Cleanup happens in executeCode, but explicit cleanup is good too
}
```

### 7. Prevent Shell Injection

Always sanitize user input, especially code:

```javascript
// ✅ Good - Use base64 encoding
const sanitizedCode = Buffer.from(code).toString('base64');
const command = `echo "${sanitizedCode}" | base64 -d > /code/${filename}`;

// ❌ Bad - Direct string interpolation
const command = `echo "${code}" > /code/${filename}`;
```

### 8. Add Timeouts for Long Operations

```javascript
// ✅ Good
const timeoutId = setTimeout(() => {
  reject(new Error("Execution timed out"));
}, 30000);

// Clear timeout on completion
clearTimeout(timeoutId);
```

### 9. Follow the Factory Pattern

When adding new implementations, use the factory pattern:

```javascript
// ✅ Good
export const QueuePublisherService = {
  bullmq: () => new BullMqPublisher(),
  kafka: () => new KafkaPublisher(), // Easy to add new
};
```

### 10. Use Singleton for Expensive Resources

```javascript
// ✅ Good
class DockerService extends ContainerManager {
  static instance;

  constructor() {
    if (DockerService.instance) {
      return DockerService.instance;
    }
    // ... initialization
    DockerService.instance = this;
  }
}
```

---

## Troubleshooting

### Docker Not Running

```
Error: connect EACCES /var/run/docker.sock
```
**Solution**: Make sure Docker Desktop is running

### Redis Connection Failed

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution**: Start Redis server or check REDIS_HOST in .env

### MSSQL Connection Failed

```
Error: Connection refused
```
**Solution**: Check DB credentials in .env and ensure MSSQL is running

### Pastebin API Error

```
Error: HTTP 401: Unauthorized
```
**Solution**: Check PASTEBIN_API_KEY in .env

### Worker Not Processing Jobs

```
Queue is empty / Jobs not being picked up
```
**Solution**: 
1. Check if worker is running: `node services/workers/submissionWorker.js`
2. Check Redis connection
3. Check queue name matches

### Container Execution Timeout

```
Error: Execution timed out after 30 seconds
```
**Solution**: Code took too long. Optimize code or increase timeout in `docker.service.js`

---

## License

ISC

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the best practices outlined above
4. Test your changes
5. Submit a pull request
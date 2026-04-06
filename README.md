# AI Portfolio Builder ✨

> Transform your daily thoughts into a professional portfolio and blog with AI-powered automation

[![Deploy](https://github.com/alstjd9615-code/minseongkim-dev/actions/workflows/deploy.yml/badge.svg)](https://github.com/alstjd9615-code/minseongkim-dev/actions/workflows/deploy.yml)
[![Python](https://img.shields.io/badge/python-3.13-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/react-19-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.9-3178C6.svg)](https://www.typescriptlang.org/)
[![AWS](https://img.shields.io/badge/AWS-Serverless-FF9900.svg)](https://aws.amazon.com/)

An all-in-one platform that combines **AI-powered portfolio generation**, **daily journaling**, and **intelligent blog creation** using AWS serverless architecture and Amazon Bedrock (Claude 3.5 Sonnet).

---

## ✨ Features

### 🤖 AI Portfolio Generator
- **Natural Language Input**: Chat with AI to build your portfolio naturally
- **Automatic Structuring**: AI organizes your experience, skills, and projects into professional sections
- **Notion-Style Rendering**: Beautiful markdown-based block viewer with dark/light mode

### 📓 Daily Journal
- **Quick Capture**: Record daily thoughts, learnings, and experiences
- **AI Categorization**: Automatic tagging and categorization
- **Smart Search**: Filter by category, date, and tags

### ✍️ AI Blog Generator
- **Diary to Blog**: Transform your journal entries into polished blog posts with one click
- **AI Writing Assistant**: Claude 3.5 Sonnet generates engaging, readable content
- **Draft Management**: Save, edit, and publish your posts
- **Public Sharing**: Share published posts with custom URLs
- **External Publishing**: Export to Medium, Tistory (coming soon)

### 📊 Analytics Dashboard
- **Activity Tracking**: Monitor your writing and productivity
- **Insights**: Visualize trends in your journal and blog posts
- **Statistics**: Track views, posts, and engagement

### 🔐 Secure & Scalable
- **AWS Cognito Authentication**: Secure user management
- **Serverless Architecture**: Auto-scaling, pay-per-use infrastructure
- **CloudFront CDN**: Fast global content delivery
- **DynamoDB**: High-performance NoSQL database

---

## 🏗️ Architecture

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
    ┌────▼────┐
    │CloudFront│──► S3 (Static React App)
    │   +CDN   │
    └────┬────┘
         │
    ┌────▼────────┐
    │ API Gateway │──► Cognito (Authentication)
    └────┬────────┘
         │
    ┌────▼───────────────────────────┐
    │      Lambda Functions          │
    │  ┌──────────────────────────┐  │
    │  │ • chat      ┐            │  │
    │  │ • portfolio │            │  │
    │  │ • diary     │──► Bedrock │  │
    │  │ • blog      │   (Claude) │  │
    │  │ • stats     ┘            │  │
    │  └──────────────────────────┘  │
    └────┬───────────────────────────┘
         │
    ┌────▼─────────┐
    │  DynamoDB    │
    │ ┌──────────┐ │
    │ │Sessions  │ │
    │ │Portfolio │ │
    │ │Diary     │ │
    │ │Blog      │ │
    │ └──────────┘ │
    └──────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, React Router |
| **Backend** | AWS Lambda (Python 3.13) |
| **AI Engine** | Amazon Bedrock (Claude 3.5 Sonnet) |
| **Database** | Amazon DynamoDB (On-Demand) |
| **Authentication** | Amazon Cognito |
| **API** | Amazon API Gateway (REST) |
| **CDN/Storage** | Amazon CloudFront + S3 |
| **Infrastructure** | AWS SAM (Serverless Application Model) |
| **CI/CD** | GitHub Actions |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Python 3.13+
- AWS CLI configured with credentials
- AWS SAM CLI
- AWS account with Bedrock model access

### 1. Clone the Repository

```bash
git clone https://github.com/alstjd9615-code/minseongkim-dev.git
cd minseongkim-dev
```

### 2. Install Dependencies

```bash
# Frontend
npm install

# Backend (if testing locally)
cd backend
pip install -r requirements.txt
```

### 3. Configure Environment

Create a `.env.local` file in the root directory:

```env
VITE_API_BASE_URL=https://your-api-gateway-url.amazonaws.com/dev
VITE_USER_POOL_ID=your-cognito-user-pool-id
VITE_USER_POOL_CLIENT_ID=your-cognito-client-id
VITE_AWS_REGION=ap-northeast-2
```

### 4. Deploy Backend (AWS)

```bash
cd infrastructure

# Build Lambda functions
sam build

# Deploy to AWS (first time - interactive)
sam deploy --guided

# Save the output values (API URL, Cognito Pool ID, etc.)
```

The deployment will output:
- `ApiUrl`: Your API Gateway endpoint
- `UserPoolId`: Cognito User Pool ID
- `UserPoolClientId`: Cognito App Client ID
- `FrontendBucketName`: S3 bucket for frontend

Update your `.env.local` with these values.

### 5. Run Frontend Locally

```bash
# Development mode
npm run dev

# Build for production
npm run build
```

### 6. Deploy Frontend to S3

```bash
npm run build
aws s3 sync dist/ s3://<FrontendBucketName>/ --delete
```

---

## 📁 Project Structure

```
.
├── src/                          # Frontend React Application
│   ├── api/                      # API client modules
│   │   ├── chat.ts               # Chat API
│   │   ├── portfolio.ts          # Portfolio API
│   │   ├── diary.ts              # Diary API
│   │   ├── blog.ts               # Blog API
│   │   └── stats.ts              # Analytics API
│   ├── components/               # React components
│   │   ├── Auth/                 # Authentication UI
│   │   ├── Chat/                 # Chat interface
│   │   ├── Portfolio/            # Portfolio viewer (Notion-style)
│   │   ├── Diary/                # Diary management
│   │   ├── Blog/                 # Blog editor & viewer
│   │   └── Dashboard/            # Analytics dashboard
│   ├── contexts/                 # React Context providers
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities (auth, helpers)
│   └── types/                    # TypeScript definitions
│
├── backend/                      # Backend Lambda Functions
│   ├── functions/
│   │   ├── chat/                 # AI chat handler (Bedrock)
│   │   ├── portfolio/            # Portfolio CRUD
│   │   ├── diary/                # Diary CRUD
│   │   ├── blog/                 # AI blog generator
│   │   ├── blog_publish/         # External publishing
│   │   ├── public_blog/          # Public blog viewer
│   │   ├── stats/                # Analytics
│   │   └── public/               # Public APIs
│   └── requirements.txt          # Python dependencies
│
├── infrastructure/               # AWS Infrastructure
│   ├── template.yaml             # SAM/CloudFormation template
│   └── samconfig.toml            # SAM deployment config
│
└── .github/
    └── workflows/
        └── deploy.yml            # CI/CD pipeline
```

---

## 🔧 Configuration

### Environment Variables

#### Frontend (`.env.local`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | API Gateway endpoint | `https://xxx.execute-api.ap-northeast-2.amazonaws.com/dev` |
| `VITE_USER_POOL_ID` | Cognito User Pool ID | `ap-northeast-2_xxxxxxxxx` |
| `VITE_USER_POOL_CLIENT_ID` | Cognito App Client ID | `xxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `VITE_AWS_REGION` | AWS region | `ap-northeast-2` |

#### Backend (AWS Lambda Environment Variables)

Set in `infrastructure/template.yaml`:

| Variable | Description | Default |
|----------|-------------|---------|
| `SESSIONS_TABLE` | DynamoDB sessions table | `portfolio-sessions` |
| `PORTFOLIOS_TABLE` | DynamoDB portfolios table | `portfolio-data` |
| `DIARY_TABLE` | DynamoDB diary table | `portfolio-diary` |
| `BLOG_TABLE` | DynamoDB blog table | `portfolio-blog` |
| `BEDROCK_MODEL_ID` | Bedrock model identifier | `anthropic.claude-3-5-sonnet-20240620-v1:0` |
| `MAX_TOKENS` | Max AI response tokens | `4096` |
| `CORS_ORIGIN` | CORS allowed origin | `*` |

---

## 🎯 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/chat` | Send chat message to AI | ✅ |
| `GET` | `/portfolio/:id` | Get portfolio | ✅ |
| `PUT` | `/portfolio/:id` | Update portfolio | ✅ |
| `POST` | `/diary` | Create diary entry | ✅ |
| `GET` | `/diary` | List diary entries | ✅ |
| `POST` | `/blog` | Generate blog from diary | ✅ |
| `GET` | `/blog` | List blog posts | ✅ |
| `PUT` | `/blog/:id` | Update blog post | ✅ |
| `DELETE` | `/blog/:id` | Delete blog post | ✅ |
| `POST` | `/blog/:id/publish/:platform` | Publish to external platform | ✅ |
| `GET` | `/public/blog/:userId` | Public blog list | ❌ |
| `GET` | `/public/blog/:userId/:postId` | Public blog post | ❌ |
| `GET` | `/stats` | User statistics | ✅ |

---

## 🔐 Security

- **Authentication**: AWS Cognito with JWT tokens
- **Authorization**: Lambda authorizers validate tokens
- **CORS**: Configurable allowed origins
- **S3**: Private buckets with CloudFront OAC (Origin Access Control)
- **API Rate Limiting**: API Gateway throttling enabled
- **Input Validation**: All user inputs sanitized
- **HTTPS Only**: Enforced via CloudFront

---

## 🚢 Deployment

### Manual Deployment

```bash
# Build and deploy backend
cd infrastructure
sam build && sam deploy

# Build and deploy frontend
npm run build
aws s3 sync dist/ s3://<bucket-name>/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"
```

### Automated Deployment (GitHub Actions)

Push to `main` branch triggers automatic deployment:

1. **Detect Changes**: Determines if backend or frontend changed
2. **Deploy Backend**: Runs `sam build` and `sam deploy`
3. **Deploy Frontend**: Builds React app and syncs to S3
4. **Cache Invalidation**: Invalidates CloudFront cache

---

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Build test
npm run build
```

---

## 📊 AWS Services Used

- **Compute**: AWS Lambda
- **AI/ML**: Amazon Bedrock (Claude 3.5 Sonnet)
- **Database**: Amazon DynamoDB
- **API**: Amazon API Gateway
- **CDN**: Amazon CloudFront
- **Storage**: Amazon S3
- **Authentication**: Amazon Cognito
- **Monitoring**: Amazon CloudWatch
- **Infrastructure**: AWS SAM / CloudFormation

---

## 🛠️ Development

### Local Development

```bash
# Start frontend dev server
npm run dev

# The app will be available at http://localhost:5173
```

### Backend Testing

```bash
# Invoke Lambda locally (requires SAM CLI)
cd infrastructure
sam local invoke ChatFunction --event events/chat-event.json
```

---

## 📝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Amazon Bedrock](https://aws.amazon.com/bedrock/) and Claude 3.5 Sonnet
- UI inspired by [Notion](https://www.notion.so/)
- Deployed on AWS Serverless infrastructure

---

## 📧 Contact

**MinSeong Kim** - [@alstjd9615-code](https://github.com/alstjd9615-code)

Project Link: [https://github.com/alstjd9615-code/minseongkim-dev](https://github.com/alstjd9615-code/minseongkim-dev)

---

## 🗺️ Roadmap

- [x] AI Portfolio Generation
- [x] Daily Journal
- [x] AI Blog Generator
- [x] Analytics Dashboard
- [x] CI/CD Pipeline
- [ ] Blog Editor with Rich Text
- [ ] Image Upload to S3
- [ ] External Platform Publishing (Medium, Tistory)
- [ ] SEO Optimization
- [ ] PDF Export
- [ ] Multi-language Support
- [ ] Mobile App (React Native)

---

Made with ❤️ using AWS and AI
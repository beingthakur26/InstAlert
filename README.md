# 🚨 InstaAlert: AI-Powered Incident Response Platform

![InstaAlert Banner](https://img.shields.io/badge/Status-Hackathon_Project-blueviolet?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-MERN_%2B_Socket.io_%2B_AI-green?style=for-the-badge)

**InstaAlert** is a high-performance, SaaS-based Incident Response Platform designed for modern engineering teams. Inspired by industry leaders like PagerDuty and Opsgenie, it leverages Artificial Intelligence to streamline the entire incident lifecycle—from detection and alerting to automated postmortems and SLA tracking.

---

## 📖 Table of Contents
- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Key Features](#-key-features)
- [Platform Working](#-platform-working)
- [Workflow](#-workflow)
- [What We Added](#-what-we-added)
- [What Makes It Different](#-what-makes-it-different)
- [Technical Stack](#-technical-stack)
- [Project Structure](#-project-structure)
- [Setup & Running Process](#-setup--running-process)
- [How It Works](#-how-it-works)

---

## 🎯 Problem Statement

In the world of 24/7 digital services, downtime is extremely costly. Traditional incident management faces several critical challenges:

- **Fragmented Alerting**: Teams struggle with lack of centralized alerting and incident coordination across multiple tools
- **Slow Root Cause Identification**: Difficulty in quickly identifying root causes during high-pressure incidents
- **Communication Gaps**: Fragmented communication channels during critical events lead to miscoordination
- **Manual Documentation**: Time-consuming and inconsistent post-incident documentation processes
- **No Unified Visibility**: Lack of unified view of service health for both internal teams and external users
- **SLA Compliance Issues**: Challenges in tracking SLA compliance and predicting breaches
- **Inefficient Assignment**: Manual and often incorrect assignment of incidents to appropriate team members
- **Knowledge Loss**: Past incident learnings are not effectively captured or reused

---

## 💡 Solution

InstaAlert unifies monitoring, communication (DMs/Channels), and documentation (Postmortems/Runbooks) into a single, AI-enhanced workspace. The platform provides:

### Centralized Incident Management
A single platform for creating, tracking, and resolving incidents with real-time updates and comprehensive audit trails.

### AI-Powered Intelligence
Automated root cause analysis, incident summarization, severity prediction, and intelligent assignee recommendations powered by Mistral AI and OpenAI.

### Integrated Communication
Real-time chat channels per incident, direct messaging between team members, and instant notifications via Socket.io.

### Automated Documentation
One-click postmortem generation using AI, eliminating manual documentation overhead and ensuring consistency.

### Public Transparency
Dedicated public status pages to keep customers informed about service health and incident progress.

### SLA Monitoring
Real-time SLA tracking with breach prediction to ensure compliance and proactive management.

---

## ✨ Key Features

### 🛠️ Incident Management
- **Real-time Incident Tracking**: Create, assign, and resolve incidents with live status updates
- **Priority Levels**: Categorize incidents by severity (Critical, High, Medium, Low)
- **Activity Logs**: Automated audit trail for every action taken during an incident
- **Incident Codes**: Unique identifiers (e.g., INC-ABC123) for easy reference
- **CSV Export**: Export incident data for reporting and analysis
- **Status Workflow**: Track incidents through open → in_progress → monitoring → closed

### 🤖 AI-Powered Intelligence (Powered by Mistral AI & OpenAI)
- **Root Cause Analysis (RCA)**: AI analyzes incident logs and communication to identify likely causes
- **Incident Summarization**: Quick, high-level summaries for stakeholders
- **Severity Prediction**: AI predicts the potential impact of new incidents with confidence scores
- **Assignee Recommendations**: Suggests best team members based on historical data and skills
- **Timeline Compression**: Automatically extracts key events from chat logs
- **AI Chat Assistant**: Available in chat channels with @instaalert mentions
- **Similar Incident Detection**: Finds historical incidents with similar patterns for faster resolution

### 💬 Integrated Communication
- **Incident Channels**: Dedicated chat rooms for every incident
- **Direct Messaging**: Private 1-on-1 communication for team members
- **Real-time Notifications**: Instant alerts via Socket.io for all stakeholders
- **Online Presence**: Real-time tracking of team member availability

### 📈 Reliability & Compliance
- **SLA Tracking**: Monitor Service Level Agreements in real-time with breach prediction
- **Automated Postmortems**: Generate comprehensive post-incident reports with a single click
- **Postmortem Management**: Create, update, download (TXT format), and publish postmortems
- **Public Status Page**: Dedicated page to inform external users about service health
- **Notification Channels**: Integration with Slack, email, and webhooks
- **Blameless Culture**: AI generates structured, blameless post-incident reviews focusing on system improvements

### 👥 Organization Management
- **Multi-tenant Architecture**: Organizations with owners and members
- **Join Codes**: Easy team onboarding with organization join codes
- **Role-based Access**: Admin, Owner, Responder, and Viewer roles
- **Team Management**: View members, assign incidents, track member activity

---

## ⚙️ Platform Working

### Frontend (Next.js 14 App Router)
The frontend provides a modern, responsive dashboard interface built with:
- Server-side rendering and static generation via Next.js App Router
- Real-time updates via Socket.io-client integration
- Type-safe development with TypeScript
- Beautiful UI components with Shadcn/UI and Tailwind CSS 4
- Interactive charts and analytics with Recharts

### Backend (Node.js + Express.js)
The backend handles:
- RESTful API endpoints for all CRUD operations
- Real-time bidirectional communication via Socket.io
- JWT-based authentication with HTTP-only cookies
- MongoDB database operations via Mongoose ODM
- AI integration with Mistral AI and OpenAI SDKs
- Email notifications via Nodemailer
- Rate limiting and security middleware

### Database (MongoDB)
Stores:
- User accounts and authentication data
- Organization and team membership information
- Incident records with full activity logs
- Chat messages and channel data
- Postmortem documents
- SLA configurations and breach records
- AI usage tracking per organization

### AI Layer (Mistral AI + OpenAI)
Provides intelligent features:
- Primary AI provider: Mistral AI (mistral-small-latest)
- Fallback provider: OpenAI (gpt-4o-mini)
- Automatic failover with exponential backoff retry logic
- Usage tracking and cost management per organization

### Real-time Communication (Socket.io)
Enables:
- Instant message delivery in incident channels and DMs
- Real-time online presence indicators
- Live incident status updates
- AI assistant responses in chat
- Organization-wide event broadcasting

---

## 🔄 Workflow

### User Journey
1. **Registration/Login**: Users register with username, email, password or login with existing credentials
2. **Organization Setup**: 
   - New users create an organization OR join an existing one using a join code
   - Organization owners manage members, settings, and billing
3. **Dashboard Access**: Once in an organization, users see:
   - Organization overview with stats (members, active incidents, resolved, assignments)
   - Real-time presence of team members
   - Recent activity feed

### Incident Management Workflow
1. **Creation**: 
   - Users create incidents with title, description, priority, type, location
   - System generates unique incident code (e.g., INC-ABC123)
   - Notifications sent to team via configured channels (Slack, email, webhooks)
   
2. **Assignment & Tracking**:
   - Incidents assigned to team members (manually or AI-recommended)
   - Status tracking: open → in_progress → monitoring → closed
   - All actions logged in activity trail

3. **Communication**:
   - Dedicated chat channel created for each incident
   - Team members chat in real-time via Socket.io
   - AI assistant available via @instaalert mentions
   - Direct messaging between team members

4. **AI Analysis**:
   - **Summarization**: Generate concise incident summaries for stakeholders
   - **Root Cause Analysis**: AI analyzes logs and chat to suggest causes
   - **Severity Prediction**: Predict impact based on description and history
   - **Similar Incidents**: Find historical incidents with similar patterns

5. **Resolution**:
   - Mark incident as resolved with resolution notes
   - System tracks resolution time and SLA compliance

6. **Post-Incident**:
   - Generate AI-powered postmortem with one click
   - Manual postmortem creation and editing
   - Download postmortem as text file
   - Publish to status page for transparency

### Backend Request Flow
```
Client Request → Express Routes → Middleware (Validation, Rate Limiting, Auth) 
→ Controllers → Services → Database (MongoDB)
                ↓
           Socket.io Events → Real-time Updates
```

### Notification Workflow
- Configurable notification channels (Slack, Email, Webhooks)
- Events: incident.created, incident.updated, incident.resolved, sla.breach
- Rich HTML emails with incident details
- Slack messages with formatted text

---

## ➕ What We Added

### Core Functionality
- Complete incident lifecycle management with status tracking
- Real-time chat system with incident-specific channels
- Direct messaging between team members
- Multi-tenant organization architecture
- Role-based access control (Admin, Owner, Responder, Viewer)

### AI Integrations
- Dual AI provider support (Mistral + OpenAI) with automatic failover
- AI-powered root cause analysis from incident data
- Intelligent incident summarization for stakeholders
- Severity prediction with confidence scoring
- Smart assignee recommendations based on historical performance
- Timeline compression from chat logs
- Chat-integrated AI assistant with @mention support
- Similar incident detection using historical patterns
- One-click automated postmortem generation

### Communication Features
- Real-time presence indicators for team members
- Incident-specific chat channels
- Direct messaging system
- Socket.io integration for instant updates
- Notification channels (Slack, Email, Webhooks)

### Compliance & Reliability
- SLA tracking with real-time breach prediction
- Comprehensive activity logging for audit trails
- Public status pages for customer transparency
- Blameless postmortem generation
- CSV export for incident reporting

### Developer Experience
- Clean, modular codebase architecture
- TypeScript for type safety
- Comprehensive error handling
- Rate limiting middleware
- JWT authentication with secure HTTP-only cookies

---

## 🏆 What Makes It Different

### 1. **Dual AI Provider Architecture**
Unlike competitors that rely on a single AI provider, InstaAlert features primary (Mistral) + fallback (OpenAI) support with automatic failover and exponential backoff retry logic, ensuring high availability of AI features.

### 2. **Chat-Integrated AI Assistant**
While others treat AI as a separate feature, InstaAlert integrates AI directly into incident chat channels. Users can simply @mention the AI assistant for instant help, analysis, or suggestions without leaving the conversation.

### 3. **Intelligent Timeline Compression**
InstaAlert's AI doesn't just analyze data—it compresses entire chat logs into actionable timelines, extracting key events and decisions made during incident response.

### 4. **Smart Assignee Recommendations**
Goes beyond basic round-robin assignment by analyzing historical performance, skills, and past incident resolutions to recommend the best team member for each incident.

### 5. **Similar Incident Pattern Matching**
AI analyzes historical incidents to find patterns and suggest solutions based on past successes, enabling faster resolution through institutional knowledge reuse.

### 6. **Blameless Postmortem Culture**
Automated generation of structured, blameless post-incident reviews that focus on system improvements rather than individual blame, fostering a healthy engineering culture.

### 7. **Real-time Everything**
Socket.io integration goes beyond just chat—it powers online presence, incident updates, AI responses, and organization-wide event broadcasting, creating a truly live experience.

### 8. **Modern Tech Stack**
Built with cutting-edge technologies: Next.js 14 (App Router), TypeScript, Tailwind CSS 4, Shadcn/UI, and the latest AI SDKs, ensuring maintainability and developer-friendly codebase.

### 9. **Comprehensive SaaS Features**
Multi-tenant architecture, role-based access control, public status pages, SLA monitoring with breach prediction, and configurable notification channels—all in one platform.

### 10. **Hackathon-Ready Innovation**
Designed and built rapidly for Sheryians Hackathon, focusing on demonstrating innovation in incident management through practical AI applications rather than just theoretical features.

---

## 💻 Technical Stack

### **Frontend**
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Library**: [React 18](https://reactjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [Shadcn/UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Real-time**: [Socket.io-client](https://socket.io/)
- **State Management**: React Hooks & Context API
- **Validation**: [Zod](https://zod.dev/)

### **Backend**
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.org/)
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose ODM)
- **Real-time**: [Socket.io](https://socket.io/)
- **Authentication**: [JSON Web Tokens (JWT)](https://jwt.io/) & Bcrypt
- **AI Integration**: [Mistral AI SDK](https://mistral.ai/) & [OpenAI SDK](https://openai.com/)
- **Email**: [Nodemailer](https://nodemailer.com/)
- **Logging**: [Morgan](https://github.com/expressjs/morgan)
- **File Upload**: [Multer](https://github.com/expressjs/multer)
- **Scheduling**: [Node-cron](https://github.com/node-cron/node-cron)

### **DevOps & Tools**
- **Package Managers**: npm
- **Version Control**: Git
- **API Testing**: Ready for Postman/Insomnia

---

## 📂 Project Structure

```
C:\Users\singh\Desktop\Sheryians_hackathon\
├── README.md                           # Main project documentation
├── Sheriyans-Hackathon-Project-main/   # BACKEND
│   ├── server.js                        # Entry point, starts HTTP & Socket.io server
│   ├── package.json                     # Backend dependencies
│   ├── .env                             # Environment variables (not committed)
│   ├── src/
│   │   ├── app.js                       # Express app setup, route definitions
│   │   ├── config/
│   │   │   └── db.js                    # MongoDB connection configuration
│   │   ├── controllers/                 # Business logic
│   │   │   ├── activity.controller.js   # Activity logging
│   │   │   ├── admin.controller.js     # Admin operations
│   │   │   ├── ai.controller.js        # AI feature endpoints
│   │   │   ├── auth.controller.js      # Authentication (login/register)
│   │   │   ├── channel.controller.js   # Chat channels management
│   │   │   ├── incident.controller.js  # Incident CRUD & operations
│   │   │   ├── organization.controller.js # Organization management
│   │   │   ├── postmortem.controller.js # Postmortem generation & management
│   │   │   ├── statusPage.controller.js # Public status pages
│   │   │   └── user.controller.js      # User management
│   │   ├── models/                      # Mongoose schemas
│   │   │   ├── activity.model.js
│   │   │   ├── aiUsage.model.js        # Track AI API usage
│   │   │   ├── channel.model.js
│   │   │   ├── directMessage.model.js
│   │   │   ├── incident.model.js
│   │   │   ├── message.model.js
│   │   │   ├── notificationChannel.model.js
│   │   │   ├── organization.model.js
│   │   │   ├── postmortem.model.js
│   │   │   ├── referer.model.js        # Organization membership
│   │   │   ├── slaBreach.model.js
│   │   │   ├── statusPage.model.js
│   │   │   └── user.model.js
│   │   ├── routes/                      # API endpoints
│   │   │   ├── activity.route.js
│   │   │   ├── admin.route.js
│   │   │   ├── ai.route.js
│   │   │   ├── auth.route.js
│   │   │   ├── channel.route.js
│   │   │   ├── dm.route.js             # Direct messages
│   │   │   ├── incident.route.js
│   │   │   ├── notification.route.js
│   │   │   ├── organization.route.js
│   │   │   ├── postmortem.route.js
│   │   │   ├── statusPage.route.js
│   │   │   └── user.route.js
│   │   ├── services/                    # Third-party & business services
│   │   │   ├── activity.service.js
│   │   │   ├── ai.service.js           # AI integration (Mistral + OpenAI)
│   │   │   ├── github.service.js
│   │   │   ├── notification.service.js # Email, Slack, Webhook notifications
│   │   │   └── sla.service.js          # SLA monitoring
│   │   ├── socket/
│   │   │   └── socket.js               # Socket.io event handlers
│   │   └── middlewares/
│   │       ├── errorHandler.middleware.js
│   │       ├── rateLimiter.middleware.js
│   │       ├── tenant.middleware.js
│   │       ├── validateAccess.middleware.js
│   │       ├── validateRequest.middleware.js
│   │       └── validateUser.middleware.js
│   └── uploads/                         # File upload directory
│
└── Sheriyans-Hackathon-incident-SaaS-frontend-main/  # FRONTEND
    ├── package.json                      # Frontend dependencies
    ├── tsconfig.json                     # TypeScript configuration
    ├── components.json                    # Shadcn/UI configuration
    ├── .env                              # Environment variables (not committed)
    ├── app/                              # Next.js Pages & Layouts (App Router)
    │   ├── layout.tsx                    # Root layout
    │   ├── page.tsx                      # Landing page
    │   ├── globals.css                   # Global styles
    │   ├── login/page.tsx                # Login page
    │   ├── register/page.tsx             # Registration page
    │   └── dashboard/                    # Protected dashboard routes
    │       ├── layout.tsx                # Dashboard layout with sidebar
    │       ├── page.tsx                  # Dashboard overview
    │       ├── activity/page.tsx          # Activity log
    │       ├── ai-chat/page.tsx          # AI chat assistant
    │       ├── assignments/page.tsx       # My assignments
    │       ├── chat/page.tsx             # Team chat
    │       ├── create-org/page.tsx       # Create organization
    │       ├── incidents/                # Incident management
    │       │   ├── page.tsx             # Incidents list
    │       │   └── [id]/page.tsx        # Single incident view
    │       ├── join-org/page.tsx         # Join organization
    │       ├── notifications/page.tsx     # Notifications
    │       ├── postmortems/page.tsx      # Postmortem list
    │       ├── profile/page.tsx          # User profile
    │       ├── settings/page.tsx          # Settings
    │       ├── status-pages/page.tsx      # Status page management
    │       └── team/page.tsx             # Team management
    ├── components/                       # Reusable UI Components
    │   ├── ui/                          # Shadcn/UI components (40+ components)
    │   ├── dashboard/                    # Dashboard-specific components
    │   ├── incidents/                    # Incident-related components
    │   ├── org-choice-card.tsx
    │   ├── header.tsx
    │   ├── footer-section.tsx
    │   └── ... (other landing page sections)
    ├── context/
    │   └── AuthContext.tsx               # Authentication context
    ├── hooks/                            # Custom React hooks
    ├── lib/
    │   ├── api-client.ts                 # Axios instance with interceptors
    │   ├── socket.ts                     # Socket.io client setup
    │   └── utils.ts                      # Utility functions
    ├── types/
    │   └── incident.ts                   # TypeScript type definitions
    └── public/                           # Static assets
```

---

## 🛠️ Setup & Running Process

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB Atlas Account** or Local MongoDB Instance
- **API Keys** for Mistral AI and/or OpenAI
- **SMTP Credentials** for email notifications (optional)

### 1. Backend Setup

```bash
cd Sheriyans-Hackathon-Project-main
npm install
```

Create a `.env` file in the backend root directory:

```env
PORT=3001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
MISTRAL_API_KEY=your_mistral_api_key
OPENAI_API_KEY=your_openai_api_key
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
CLIENT_URL=http://localhost:3000,http://localhost:3002
```

Start the backend development server:

```bash
npm run dev
```

The backend will start on port 3001 (or as specified in .env).

### 2. Frontend Setup

```bash
cd Sheriyans-Hackathon-incident-SaaS-frontend-main
npm install
```

Create a `.env` file in the frontend root directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will start on port 3000 (Next.js default).

### 3. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

### 4. Quick Start Checklist

- [ ] MongoDB is running (local or Atlas)
- [ ] Backend `.env` file configured with all required variables
- [ ] Frontend `.env` file configured with API URLs
- [ ] Backend server running on port 3001
- [ ] Frontend server running on port 3000
- [ ] Create an account or log in
- [ ] Create or join an organization
- [ ] Start creating and managing incidents!

---

## 🔍 How It Works

### 1. **Detection & Alerting**
Incidents are triggered manually through the dashboard or can be integrated via API from external monitoring tools. The system immediately notifies relevant team members through the dashboard, real-time socket events, and configured notification channels (Slack, email, webhooks).

### 2. **AI-Enhanced Coordination**
When an incident is created, a dedicated incident channel is automatically created. The team uses this channel for real-time communication while leveraging AI features:
- **@instaalert** mentions to get AI assistance in chat
- AI analyzes incident details to predict severity
- System recommends the best team member for assignment
- AI identifies similar past incidents for reference

### 3. **Real-time Collaboration**
Team members communicate through:
- **Incident Channels**: Dedicated chat rooms for each incident
- **Direct Messages**: Private 1-on-1 communication
- **Live Presence**: See who's online in real-time
- **Instant Updates**: All changes reflected immediately via Socket.io

### 4. **Intelligent Analysis**
As the incident progresses, AI continuously:
- Summarizes chat logs and activities for stakeholders
- Analyzes patterns to identify root causes
- Compresses timelines to extract key events
- Predicts SLA breaches based on current progress

### 5. **Resolution & Documentation**
Once the service is restored:
- Incident is marked as resolved with resolution notes
- One-click AI postmortem generation creates comprehensive reports
- Postmortems can be edited, downloaded, or published
- Published postmortems appear on the public status page

### 6. **Continuous Learning**
The system learns from each incident:
- Historical data improves assignee recommendations
- Similar incident detection becomes more accurate
- AI models benefit from accumulated knowledge
- Teams develop better response patterns over time

---

## 🤝 Acknowledgements

- Developed during the **Sheryians Hackathon**
- UI Design inspired by **Vercel** and **PagerDuty**
- AI capabilities powered by **Mistral AI** and **OpenAI**
- Built with ❤️ by the InstaAlert Team

---

## 📬 Contact & Support

For questions, feedback, or support, please reach out to the InstaAlert team or create an issue in the repository.

---

© 2026 InstaAlert. All Rights Reserved.

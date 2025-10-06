# CI/CD Pipeline Visualizer

A comprehensive dashboard for monitoring and analyzing CI/CD pipeline performance with real-time updates, DORA metrics, and intelligent insights.

## 🚀 Features

### Core Functionality
- **Real-time Pipeline Monitoring** - Live updates via WebSocket connections
- **Multi-platform Support** - GitHub Actions, GitLab CI, Jenkins integration
- **DORA Metrics** - Deployment Frequency, Lead Time, MTTR, Change Failure Rate
- **Performance Analytics** - Success rates, duration trends, bottleneck identification
- **Smart Alerts** - Automated notifications for failures and performance issues
- **Historical Analysis** - Long-term trends and pattern recognition

### Dashboard Features
- **Interactive Visualizations** - Charts, graphs, and real-time metrics
- **Pipeline Health Scoring** - Automated health assessment and recommendations
- **Failure Analysis** - Root cause analysis and common failure patterns
- **Team Insights** - Performance comparisons and optimization suggestions

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** for data storage
- **Socket.IO** for real-time communication
- **GitHub API** integration
- **Cron jobs** for automated data sync

### Frontend
- **React 18** with modern hooks
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Framer Motion** for animations
- **Socket.IO Client** for real-time updates

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL 12+
- GitHub Personal Access Token (optional)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/cicd-pipeline-visualizer.git
   cd cicd-pipeline-visualizer
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   # Copy example environment file
   cp server/.env.example server/.env
   
   # Edit server/.env with your configuration
   DATABASE_URL=postgresql://username:password@localhost:5432/cicd_visualizer
   GITHUB_TOKEN=your_github_personal_access_token
   GITHUB_ORGANIZATION=your_organization_name
   ```

4. **Set up the database**
   ```bash
   cd server
   npm run migrate
   ```

5. **Start the application**
   ```bash
   # From the root directory
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔧 Configuration

### GitHub Integration

1. **Create a GitHub Personal Access Token**
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Generate a new token with `repo` and `actions:read` permissions
   - Add the token to your `.env` file as `GITHUB_TOKEN`

2. **Set up your organization**
   - Add your GitHub organization name to `GITHUB_ORGANIZATION` in `.env`
   - The app will automatically discover repositories in your organization

### Database Configuration

The application uses PostgreSQL with the following key tables:
- `pipelines` - Pipeline configurations and metadata
- `pipeline_runs` - Individual pipeline execution data
- `pipeline_stages` - Detailed stage/job information
- `dora_metrics` - Calculated DORA metrics over time
- `alerts` - System-generated alerts and notifications

## 📊 Usage

### Adding Pipelines

1. **Via GitHub Integration**
   - Go to Settings > GitHub
   - Configure your GitHub token and organization
   - Use the "Sync Repository" feature to add GitHub Actions workflows

2. **Manual Configuration**
   - Go to Pipelines page
   - Click "Add Pipeline"
   - Enter pipeline details (name, platform, repository URL)

### Monitoring Performance

1. **Dashboard Overview**
   - View overall system health and key metrics
   - Monitor real-time pipeline status
   - Track DORA metrics trends

2. **Pipeline Details**
   - Click on any pipeline to see detailed information
   - View recent runs, success rates, and performance trends
   - Analyze stage-level performance and bottlenecks

3. **Metrics & Analytics**
   - Access comprehensive DORA metrics
   - Perform failure analysis and pattern recognition
   - Export data for external analysis

## 🚀 Deployment

### Vercel Deployment (Recommended)

The application is optimized for Vercel deployment:

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy automatically on git push**

### Environment Variables for Production

```bash
# Database
DATABASE_URL=your_production_postgresql_url

# GitHub
GITHUB_TOKEN=your_github_token
GITHUB_ORGANIZATION=your_org

# Server
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-app.vercel.app

# Security
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

### Database Hosting Options

- **Neon** (Recommended) - Serverless PostgreSQL
- **Supabase** - Full-stack platform with PostgreSQL
- **Railway** - Simple PostgreSQL hosting
- **AWS RDS** - Enterprise-grade database

## 📈 DORA Metrics Explained

### Deployment Frequency
- **Elite**: Multiple deployments per day
- **High**: Between once per day and once per week
- **Medium**: Between once per week and once per month
- **Low**: Between once per month and once per 6 months

### Lead Time for Changes
- **Elite**: Less than one hour
- **High**: Between one hour and one day
- **Medium**: Between one day and one week
- **Low**: Between one week and one month

### Mean Time to Recovery (MTTR)
- **Elite**: Less than one hour
- **High**: Between one hour and one day
- **Medium**: Between one day and one week
- **Low**: Between one week and one month

### Change Failure Rate
- **Elite**: 0-15%
- **High**: 16-30%
- **Medium**: 31-45%
- **Low**: 46-60%

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and patterns
- Add tests for new functionality
- Update documentation for API changes
- Use semantic commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- DORA metrics based on Google's State of DevOps research
- Built with modern React and Node.js best practices
- Inspired by the need for better CI/CD visibility

## 📞 Support

- Create an issue for bug reports or feature requests
- Check the documentation for common questions
- Join our community discussions for help and tips

---

**Made with ❤️ for the DevOps community**
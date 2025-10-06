const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

const GITHUB_API_BASE = 'https://api.github.com';

// Middleware to check GitHub token
const checkGitHubToken = (req, res, next) => {
  if (!process.env.GITHUB_TOKEN) {
    return res.status(400).json({ 
      error: 'GitHub token not configured. Please set GITHUB_TOKEN environment variable.' 
    });
  }
  next();
};

// GitHub API client with authentication
const githubClient = axios.create({
  baseURL: GITHUB_API_BASE,
  headers: {
    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'CI-CD-Visualizer'
  }
});

// Get repositories for organization or user
router.get('/repositories', checkGitHubToken, async (req, res) => {
  try {
    const { owner, type = 'all', per_page = 100 } = req.query;
    
    if (!owner) {
      return res.status(400).json({ error: 'Owner parameter is required' });
    }
    
    const response = await githubClient.get(`/orgs/${owner}/repos`, {
      params: { type, per_page, sort: 'updated' }
    });
    
    const repositories = response.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      default_branch: repo.default_branch,
      updated_at: repo.updated_at,
      has_workflows: true
    }));
    
    res.json({ repositories });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    if (error.response?.status === 404) {
      res.status(404).json({ error: 'Organization or user not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch repositories' });
    }
  }
});

// Get workflows for a repository
router.get('/repositories/:owner/:repo/workflows', checkGitHubToken, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    
    const response = await githubClient.get(`/repos/${owner}/${repo}/actions/workflows`);
    
    const workflows = response.data.workflows.map(workflow => ({
      id: workflow.id,
      name: workflow.name,
      path: workflow.path,
      state: workflow.state,
      created_at: workflow.created_at,
      updated_at: workflow.updated_at,
      url: workflow.html_url
    }));
    
    res.json({ workflows });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    if (error.response?.status === 404) {
      res.status(404).json({ error: 'Repository or workflows not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch workflows' });
    }
  }
});

module.exports = router;
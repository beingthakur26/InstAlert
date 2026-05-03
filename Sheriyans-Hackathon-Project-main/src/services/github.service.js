import axios from "axios";
import qs from "querystring";
import { config } from "dotenv";
config();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

const getAuthUrl = () => {
  return `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo`;
};

const getUser = async (code) => {
  const response = await axios.post(
    "https://github.com/login/oauth/access_token",
    qs.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  const accessToken = await response.data.access_token;
  const userRes = await axios.get("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const user = { accessToken, data: userRes.data };

  return user;
};

const getUserRepos = async (accessToken) => {
  const response = await axios.get("https://api.github.com/user/repos", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
    params: {
      sort: "updated",
      per_page: 500,
    },
  });
  return response.data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
    html_url: repo.html_url,
    description: repo.description,
    fork: repo.fork,
    url: repo.url,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    pushed_at: repo.pushed_at,
    stargazers_count: repo.stargazers_count,
    watchers_count: repo.watchers_count,
  }));
};

const getUserCommits = async (accessToken, owner, repo) => {
    if (!accessToken) {
            return res.status(401).json({ error: 'Access token required' });
        }

        if (owner && repo) {
            // Get commits for a specific repository
            const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/vnd.github.v3+json'
                },
                params: {
                    per_page: 100
                }
            });
            return response.data;
        } else {
            // Get all repositories first, then get commits for each
            const reposResponse = await axios.get('https://api.github.com/user/repos', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/vnd.github.v3+json'
                },
                params: {
                    sort: 'updated',
                    per_page: 100
                }
            });

            const repos = reposResponse.data;
            const commitsWithRepos = [];

            // Get commits for each repository (limit to first 10 to avoid rate limiting)
            for (const repo of repos.slice(0, 10)) {
                try {
                    const commitsResponse = await axios.get(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/commits`, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            Accept: 'application/vnd.github.v3+json'
                        },
                        params: {
                            per_page: 10
                        }
                    });
                    commitsWithRepos.push({
                        repository: repo.full_name,
                        commits: commitsResponse.data
                    });
                } catch (err) {
                    console.log(`Error fetching commits for ${repo.full_name}:`, err.message);
                }
            }

            return commitsWithRepos;
        }
}

export default {
    getAuthUrl,
    getUser,
    getUserRepos,
    getUserCommits
};
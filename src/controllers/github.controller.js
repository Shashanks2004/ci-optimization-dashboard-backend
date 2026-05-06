import axios from "axios";

export const getUserRepos = async (req, res) => {
  try {
    if (!req.session.githubToken) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const repos = await axios.get(
      "https://api.github.com/user/repos",
      {
        headers: {
          Authorization: `token ${req.session.githubToken}`,
        },
      }
    );

    res.json(repos.data);

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch repos" });
  }
};

export const getGithubProfile = async (req, res) => {
  try {
    if (!req.session.githubToken) {
      return res.json({ connected: false });
    }

    const response = await axios.get(
      "https://api.github.com/user",
      {
        headers: {
          Authorization: `token ${req.session.githubToken}`,
        },
      }
    );

    res.json({
      connected: true,
      user: response.data,
    });

  } catch (error) {
    res.json({ connected: false });
  }
};

export const getRepoCommits = async (req, res) => {
  try {
    const { repo } = req.params;

    if (!req.session.githubToken) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const username = req.session.githubUser.login;

    const response = await axios.get(
      `https://api.github.com/repos/${username}/${repo}/commits?per_page=5`,
      {
        headers: {
          Authorization: `token ${req.session.githubToken}`,
        },
      }
    );

    const commits = response.data.map(commit => ({
      sha: commit.sha.substring(0, 7),
      message: commit.commit.message,
      author: commit.commit.author.name,
      date: commit.commit.author.date,
    }));

    res.json(commits);

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: "Failed to fetch commits" });
  }
};

export const getRepoMetrics = async (req, res) => {
  try {
    const { repo } = req.params;

    if (!req.session.githubToken) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const username = req.session.githubUser.login;

    const runsResponse = await axios.get(
      `https://api.github.com/repos/${username}/${repo}/actions/runs?per_page=20`,
      {
        headers: {
          Authorization: `token ${req.session.githubToken}`,
        },
      }
    );

    const runs = runsResponse.data.workflow_runs || [];

    const totalBuilds = runs.length;
    const successful = runs.filter(r => r.conclusion === "success").length;
    const failed = runs.filter(r => r.conclusion === "failure").length;

    const failureRate =
      totalBuilds > 0
        ? ((failed / totalBuilds) * 100).toFixed(1)
        : 0;

    const avgDuration =
      totalBuilds > 0
        ? Math.round(
            runs.reduce((sum, r) => {
              if (!r.run_started_at || !r.updated_at) return sum;

              return (
                sum +
                (new Date(r.updated_at) - new Date(r.run_started_at))
              );
            }, 0) /
              totalBuilds /
              1000
          )
        : 0;

    const healthScore =
      totalBuilds > 0
        ? Math.max(0, 100 - failureRate)
        : 0;

    res.json({
      totalBuilds,
      successful,
      failed,
      failureRate,
      avgDuration,
      healthScore,
    });

  } catch (error) {
    console.error("METRICS ERROR:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to fetch metrics" });
  }
};

export const getRepoTrend = async (req, res) => {
  try {
    const { repo } = req.params;

    if (!req.session.githubToken) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const username = req.session.githubUser.login;

    const runsResponse = await axios.get(
      `https://api.github.com/repos/${username}/${repo}/actions/runs?per_page=10`,
      {
        headers: {
          Authorization: `token ${req.session.githubToken}`,
        },
      }
    );

    const runs = runsResponse.data.workflow_runs || [];

    const trendData = runs.map(run => ({
      id: run.id,
      status: run.conclusion,
      date: run.run_started_at,
    })).reverse(); // oldest → newest

    res.json(trendData);

  } catch (error) {
    console.error("TREND ERROR:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to fetch trend data" });
  }
};
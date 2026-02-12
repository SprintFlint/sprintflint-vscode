import * as vscode from 'vscode';
import axios, { AxiosInstance } from 'axios';

export interface SprintFlintConfig {
    apiToken: string;
    apiUrl: string;
}

export interface Issue {
    id: string;
    title: string;
    description: string;
    status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
    points: number;
    assignee: string | null;
    sprintId: string;
    createdAt: string;
}

export class SprintFlintAPI {
    private client: AxiosInstance;

    constructor(config: SprintFlintConfig) {
        this.client = axios.create({
            baseURL: config.apiUrl,
            headers: {
                'Authorization': `Bearer ${config.apiToken}`,
                'Content-Type': 'application/json',
            },
        });
    }

    setToken(token: string) {
        this.client.defaults.headers['Authorization'] = `Bearer ${token}`;
    }

    async getIssues(type: 'mine' | 'sprint' | 'backlog'): Promise<Issue[]> {
        const params: any = { limit: 50 };
        
        if (type === 'backlog') {
            params.status = 'backlog';
        } else if (type === 'sprint') {
            // Get active sprint issues
            const sprint = await this.getActiveSprint();
            if (sprint) {
                params.sprint_id = sprint.id;
            }
        } else if (type === 'mine') {
            const user = await this.getCurrentUser();
            params.assignee = user.username;
        }

        const response = await this.client.get('/issues', { params });
        return response.data.issues;
    }

    async getActiveSprint(): Promise<{ id: string; name: string } | null> {
        try {
            const response = await this.client.get('/sprints/active');
            return response.data.sprint;
        } catch {
            return null;
        }
    }

    async getCurrentUser(): Promise<{ username: string }> {
        const response = await this.client.get('/auth/me');
        return response.data.user;
    }

    async createIssue(title: string, description?: string, points?: number): Promise<Issue> {
        const response = await this.client.post('/issues', {
            title,
            description,
            points,
        });
        return response.data.issue;
    }

    async getIssue(id: string): Promise<Issue> {
        const response = await this.client.get(`/issues/${id}`);
        return response.data.issue;
    }

    async searchIssues(query: string): Promise<Issue[]> {
        const response = await this.client.get('/issues/search', {
            params: { q: query, limit: 20 }
        });
        return response.data.issues;
    }

    async triggerAutoplay(issueId: string): Promise<{ id: string; status: string }> {
        const response = await this.client.post('/autoplay/runs', { issue_id: issueId });
        return response.data.run;
    }
}

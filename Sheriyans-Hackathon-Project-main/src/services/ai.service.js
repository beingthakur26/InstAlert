import { Mistral } from '@mistralai/mistralai';
import OpenAI from 'openai';
import { config } from 'dotenv';
import AIUsage from '../models/aiUsage.model.js';

config();

const mistralClient = process.env.MISTRAL_API_KEY ? new Mistral({ apiKey: process.env.MISTRAL_API_KEY }) : null;
const openaiClient = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const DEFAULT_MODEL = 'mistral-small-latest';
const FALLBACK_MODEL = 'gpt-4o-mini';
const MAX_TOKENS = 4096;
const MAX_RETRIES = 2;

const trackUsage = async (organizationId, userId, model, tokens, cost, endpoint) => {
    try {
        await AIUsage.create({
            organization: organizationId,
            user: userId,
            model,
            tokens_used: tokens,
            cost,
            endpoint,
        });
    } catch (err) {
        console.error('[AI] Failed to track usage:', err.message);
    }
};

const estimateCost = (model, tokens) => {
    const rates = {
        'mistral-small-latest': 0.0000002,
        'mistral-large-latest': 0.000002,
        'gpt-4o-mini': 0.00000015,
        'gpt-4o': 0.0000025,
    };
    return (tokens * (rates[model] || 0.000001));
};

const callWithRetry = async (fn, retries = MAX_RETRIES) => {
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries) throw error;
            console.warn(`[AI] Retry ${i + 1}/${retries} after error:`, error.message);
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }
};

export const askAI = async (systemPrompt, userMessage, options = {}) => {
    const { model = DEFAULT_MODEL, organizationId, userId, endpoint = 'generic', maxTokens = MAX_TOKENS, jsonMode = false } = options;

    const callPrimary = async () => {
        if (mistralClient) {
            const response = await mistralClient.chat.complete({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                maxTokens,
                ...(jsonMode && { response_format: { type: 'json_object' } }),
            });
            const content = response.choices?.[0]?.message?.content;
            if (!content) throw new Error('Empty response from Mistral');
            const tokens = response.usage?.totalTokens || 0;
            return { text: typeof content === 'string' ? content : content.map(b => b.text).join('\n\n'), tokens, provider: 'mistral' };
        }
        throw new Error('Mistral not configured');
    };

    const callFallback = async () => {
        if (openaiClient) {
            const response = await openaiClient.chat.completions.create({
                model: FALLBACK_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                max_tokens: maxTokens,
                ...(jsonMode && { response_format: { type: 'json_object' } }),
            });
            const content = response.choices?.[0]?.message?.content;
            if (!content) throw new Error('Empty response from OpenAI');
            const tokens = response.usage?.total_tokens || 0;
            return { text: content, tokens, provider: 'openai' };
        }
        throw new Error('No AI provider available');
    };

    const result = await callWithRetry(async () => {
        try {
            return await callPrimary();
        } catch (err) {
            console.warn('[AI] Primary provider failed, trying fallback:', err.message);
            return await callFallback();
        }
    });

    await trackUsage(organizationId, userId, model, result.tokens, estimateCost(model, result.tokens), endpoint);

    if (jsonMode) {
        try {
            let cleaned = result.text;
            const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonBlockMatch) {
                cleaned = jsonBlockMatch[1].trim();
            }
            const firstBrace = cleaned.indexOf('{');
            const lastBrace = cleaned.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                cleaned = cleaned.substring(firstBrace, lastBrace + 1);
            }
            const firstBracket = cleaned.indexOf('[');
            const lastBracket = cleaned.lastIndexOf(']');
            if (firstBracket !== -1 && lastBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
                cleaned = cleaned.substring(firstBracket, lastBracket + 1);
            }
            return { ...result, json: JSON.parse(cleaned) };
        } catch (err) {
            console.error('[AI] JSON parse error:', err.message, '\nRaw text:', result.text);
            throw new Error('AI returned invalid JSON');
        }
    }

    return result;
};

export const summarizeIncident = async (incident, messages, activities) => {
    const messagesText = messages.map(m =>
        `[${new Date(m.createdAt).toLocaleString()}] ${m.sender?.username || 'Unknown'}: ${m.content}`
    ).join('\n');

    const activitiesText = activities.map(a =>
        `[${new Date(a.createdAt).toLocaleString()}] ${a.user?.username || 'System'} ${a.action}: ${a.detail || ''}`
    ).join('\n');

    const systemPrompt = `You are a senior SRE analyst. Provide a structured incident summary:

## Incident Overview
- **Title**: [brief summary]
- **Severity**: [assessed impact level]
- **Duration**: [timeline overview]
- **Affected Systems**: [list impacted components]

## Key Events
[Bulleted chronological list of critical events]

## Current Status
[Current state and any ongoing actions]

## Recommendations
[2-3 actionable next steps]

Keep it concise, technical, and actionable.`;

    const userMessage = `Incident: "${incident.title}"\nType: ${incident.type} | Priority: ${incident.priority} | Status: ${incident.status}\nDescription: ${incident.description}\n\n--- Activity Timeline ---\n${activitiesText || 'No activities recorded.'}\n\n--- Report Messages ---\n${messagesText || 'No messages yet.'}`;

    return await askAI(systemPrompt, userMessage, {
        organizationId: incident.organization,
        userId: incident.reporter,
        endpoint: 'summarize',
        maxTokens: 2048,
    });
};

export const suggestRootCause = async (incident, messages, similarIncidents) => {
    const similarContext = similarIncidents.length > 0
        ? `\n\nSimilar Past Incidents:\n${similarIncidents.map(si => `- "${si.title}" (${si.type}): ${si.description.substring(0, 200)}... Resolution: ${si.resolution || 'N/A'}`).join('\n')}`
        : '';

    const messagesText = messages.slice(-20).map(m =>
        `[${m.sender?.username || 'Unknown'}]: ${m.content}`
    ).join('\n');

    const systemPrompt = `You are a root cause analysis expert. Analyze the incident data and provide:

## Probable Root Cause
[Most likely cause with confidence level 1-10]

## Contributing Factors
[List of factors that led to the incident]

## Evidence
[What data points support this analysis]

## Alternative Causes
[Other possible causes to investigate]

## Recommended Investigation Steps
[Specific steps to confirm or rule out the root cause]

Be specific, technical, and evidence-based.`;

    const userMessage = `Incident: "${incident.title}"\nType: ${incident.type} | Priority: ${incident.priority}\nLocation/Component: ${incident.location || 'N/A'}\nDescription: ${incident.description}\n\n--- Discussion ---\n${messagesText}${similarContext}`;

    return await askAI(systemPrompt, userMessage, {
        organizationId: incident.organization,
        endpoint: 'root-cause',
        maxTokens: 3000,
    });
};

export const predictSeverity = async (incident, orgIncidents) => {
    const recentIncidents = (orgIncidents || []).slice(0, 50).map(i => ({
        title: i.title || 'Untitled',
        type: i.type || 'Unknown',
        priority: i.priority || 'Medium',
        status: i.status || 'unknown',
    }));

    const systemPrompt = `You are an incident severity prediction engine. Analyze the new incident and predict its severity on a scale of 1-10.

Return ONLY a JSON object:
{
  "severity_score": <1-10>,
  "predicted_impact": "low|medium|high|critical",
  "estimated_affected_users": "<estimate or range>",
  "recommended_priority": "Low|Medium|High|Critical",
  "confidence": <0-100>,
  "reasoning": "<brief explanation>"
}`;

    const userMessage = `New Incident: "${incident.title || 'Untitled'}"\nType: ${incident.type || 'Unknown'}\nLocation: ${incident.location || 'N/A'}\nDescription: ${incident.description || 'No description'}\n\n--- Recent Organization Incidents ---\n${recentIncidents.length > 0 ? recentIncidents.map(i => `- [${i.priority}] ${i.title} (${i.type}) - ${i.status}`).join('\n') : 'No prior incidents.'}`;

    const result = await askAI(systemPrompt, userMessage, {
        organizationId: incident.organization,
        endpoint: 'severity-predict',
        jsonMode: true,
        maxTokens: 512,
    });

    return result.json;
};

export const recommendAssignees = async (incident, orgMembers, orgIncidents) => {
    const memberHistory = orgMembers.map(m => {
        const pastIncidents = orgIncidents.filter(i =>
            i.assignees?.some(a => a.user?.toString() === m._id?.toString() || a.user === m._id)
        );
        return {
            id: m._id,
            username: m.username,
            skills: m.skills || [],
            incidents_resolved: pastIncidents.filter(i => i.status === 'closed').length,
            incident_types: [...new Set(pastIncidents.map(i => i.type))],
        };
    });

    const systemPrompt = `You are a smart assignment engine. Given an incident and team member profiles, recommend the best assignees.

Consider:
1. Past experience with similar incident types
2. Resolution success rate
3. Relevant skills

Return ONLY a JSON array:
[
  {
    "user_id": "<id>",
    "username": "<name>",
    "confidence": <0-100>,
    "reason": "<why they're a good fit>"
  }
]

Recommend 2-3 people sorted by confidence.`;

    const userMessage = `Incident: "${incident.title}"\nType: ${incident.type}\nPriority: ${incident.priority}\nLocation: ${incident.location || 'N/A'}\nDescription: ${incident.description}\n\n--- Team Members ---\n${JSON.stringify(memberHistory, null, 2)}`;

    const result = await askAI(systemPrompt, userMessage, {
        organizationId: incident.organization,
        endpoint: 'recommend-assignees',
        jsonMode: true,
        maxTokens: 1024,
    });

    return result.json;
};

export const compressTimeline = async (messages, activities) => {
    const rawEvents = [
        ...messages.map(m => ({
            time: m.createdAt,
            type: 'message',
            actor: m.sender?.username || 'Unknown',
            content: m.content,
        })),
        ...activities.map(a => ({
            time: a.createdAt,
            type: 'activity',
            actor: a.user?.username || 'System',
            content: `${a.action}: ${a.detail || ''}`,
        })),
    ].sort((a, b) => new Date(a.time) - new Date(b.time));

    const rawText = rawEvents.map(e =>
        `[${new Date(e.time).toLocaleString()}] [${e.type}] ${e.actor}: ${e.content}`
    ).join('\n');

    const systemPrompt = `You are a timeline compression expert. Convert a verbose event log into a concise, readable timeline.

Format:
## Compressed Timeline

| Time | Actor | Event | Significance |
|------|-------|-------|-------------|
| ... | ... | ... | ... |

## Key Turning Points
[List the 3-5 most critical moments]

## Summary
[2-sentence summary of the incident flow]

Remove noise, keep signal.`;

    return await askAI(systemPrompt, `Raw Events (${rawEvents.length} events):\n\n${rawText}`, {
        endpoint: 'compress-timeline',
        maxTokens: 4096,
    });
};

export const generatePostmortem = async (incident, messages, activities) => {
    const messagesText = messages.map(m =>
        `[${new Date(m.createdAt).toLocaleString()}] ${m.sender?.username || 'Unknown'}: ${m.content}`
    ).join('\n');

    const systemPrompt = `You are an expert in writing post-incident reports. Generate a comprehensive, blameless postmortem:

# Postmortem: [Incident Title]

## Summary
[Brief 2-3 sentence overview]

## Impact
- **Duration**: [start to end]
- **Affected Users/Systems**: [scope]
- **Severity**: [assessment]

## Timeline
[Chronological list of key events]

## Root Cause
[Technical explanation]

## Resolution
[What was done to fix it]

## Lessons Learned
### What went well
### What went wrong
### Where we got lucky

## Action Items
| Action | Owner | Priority | Deadline |

## Prevention
[Concrete steps to prevent recurrence]

Be thorough, honest, and blameless. Focus on system improvements.`;

    const userMessage = `Incident: "${incident.title}"\nType: ${incident.type} | Priority: ${incident.priority}\nDescription: ${incident.description}\nStatus: ${incident.status}\nResolution: ${incident.resolution || 'Not yet resolved'}\n\n--- Full Discussion ---\n${messagesText}\n\n--- Activities ---\n${activities.map(a => `[${new Date(a.createdAt).toLocaleString()}] ${a.user?.username || 'System'}: ${a.action} - ${a.detail || ''}`).join('\n')}`;

    return await askAI(systemPrompt, userMessage, {
        organizationId: incident.organization,
        endpoint: 'generate-postmortem',
        maxTokens: 4096,
    });
};

export const aiChatAssistant = async (question, userIncidents, userOrg) => {
    const context = userIncidents.slice(0, 20).map(i =>
        `Incident #${i._id.toString().slice(-6)}: "${i.title}" [${i.status}] ${i.priority} - ${i.description.substring(0, 150)}...`
    ).join('\n');

    const systemPrompt = `You are InstaAlert AI, an expert incident response assistant. You have access to the user's incident history and organization context.

Your capabilities:
- Answer questions about past incidents
- Suggest actions for current incidents
- Find patterns across incidents
- Provide technical troubleshooting advice
- Recommend best practices

Be concise, helpful, and reference specific incidents when relevant.`;

    return await askAI(systemPrompt, `User Question: ${question}\n\n--- Incident History ---\n${context || 'No incidents yet.'}\n\n--- Organization ---\n${userOrg?.organizationName || 'Unknown'}`, {
        organizationId: userOrg?._id,
        endpoint: 'ai-chat',
        maxTokens: 2048,
    });
};

export const findSimilarIncidents = async (incident, allIncidents) => {
    const otherIncidents = (allIncidents || []).filter(i => i && i._id && i._id.toString() !== incident._id.toString());

    if (otherIncidents.length === 0) {
        return { similar_incidents: [] };
    }

    const systemPrompt = `You are an incident similarity engine. Find similar incidents from history.

Return ONLY a JSON object:
{
  "similar_incidents": [
    {
      "incident_id": "<id>",
      "title": "<title>",
      "similarity_score": <0-100>,
      "reason": "<why they're similar>"
    }
  ]
}

Consider: incident type, location/component, description keywords, error patterns, priority.`;

    const historyText = otherIncidents.map(i => `- "${i.title || 'Untitled'}" [${i.type || 'Unknown'}] [${i.priority || 'Medium'}] at ${i.location || 'N/A'}: ${(i.description || '').substring(0, 200)}`).join('\n');

    const userMessage = `Target Incident: "${incident.title || 'Untitled'}"\nType: ${incident.type || 'Unknown'}\nLocation: ${incident.location || 'N/A'}\nDescription: ${incident.description || 'No description'}\n\n--- Incident History (${otherIncidents.length} incidents) ---\n${historyText}`;

    const result = await askAI(systemPrompt, userMessage, {
        organizationId: incident.organization,
        endpoint: 'find-similar',
        jsonMode: true,
        maxTokens: 2048,
    });

    return result.json;
};

export default {
    askAI,
    summarizeIncident,
    suggestRootCause,
    predictSeverity,
    recommendAssignees,
    compressTimeline,
    generatePostmortem,
    aiChatAssistant,
    findSimilarIncidents,
};

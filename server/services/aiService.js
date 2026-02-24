import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export const analyzeResume = async (resumeText) => {
    try {
        const prompt = `
        You are an expert technical recruiter and hiring manager with 15+ years of experience.
        
        TASK:
        Analyze the following resume content to calculate a **Job Readiness Score** and perform a **Skill Gap Analysis**.
        
        RESUME CONTENT:
        "${resumeText.substring(0, 20000)}"

        ---
        1. EVALUATION FRAMEWORK (SCORE):
        Evaluate based on:
        - Core Technical Skills (30%)
        - Tools & Technologies (15%)
        - Practical Experience (15%)
        - Domain Knowledge (10%)
        - Problem Solving (10%)
        - Collaboration (5%)
        - Education (5%)
        - Seniority Alignment (10%)

        2. SKILL GAP ANALYSIS:
        - Extract Job Skills (implied from the candidate's likely target role based on their resume).
        - Compare against Resume Skills.
        - Identify Missing Critical & Secondary Skills.
        - Create an Upskilling Roadmap.

        ---
        OUTPUT FORMAT (STRICT JSON):
        {
            "roleTarget": "Inferred Target Role (e.g. Senior Backend Engineer)",
            "readinessScore": number (0-100),
            "readinessLevel": "Not Ready | Partially Ready | Job Ready | Highly Job Ready",
            "scoreBreakdown": {
                "core_skills": number, /* 0-100 */
                "tools_tech": number,
                "experience": number,
                "domain_knowledge": number,
                "problem_solving": number,
                "collaboration": number,
                "education": number,
                "seniority": number
            },
            "scoreExplanation": "Concise justification for the score.",
            "strengths": ["...", "...", "..."],
            "concerns": ["...", "...", "..."],
            "hiringRecommendation": "Strong Hire | Hire | Borderline | No Hire",
            "interviewFocus": ["...", "..."],
            "skillGap": {
                "matchedSkills": ["...", "..."],
                "missingCritical": ["...", "..."],
                "missingSecondary": ["...", "..."],
                "gapSeverity": "Low (70-100% match) | Medium (40-69%) | High (0-39%)",
                "gapSeverityScore": number /* 0-100% match rate */
            },
            "upskillingRoadmap": [
                {
                    "skill": "React Performance",
                    "description": "Deep dive into memoization and code splitting.",
                    "timeline": "2 Weeks",
                    "priority": "High",
                    "microSteps": [
                        "Learn useMemo and useCallback",
                        "Implement React.lazy for routes",
                        "Profile app using React DevTools"
                    ]
                }
            ],
            "suggestedOpportunities": [
                 { "role": "...", "company": "...", "link": "https://www.linkedin.com/jobs/search/?keywords=..." }
            ]
            // Provide exactly 10 opportunities
        }
        
        CRITICAL RULES:
        - Be conservative and realistic.
        - **SCORING**: If the User is missing key modern tools (e.g., Docker, deeply nested React concepts, System Design), penalize the score. 
        - **EXPLANATION**: You MUST provide a 2-3 sentence 'scoreExplanation'. Never leave it empty. Explain EXACTLY why points were deducted.
        - **FORCE SKILL GAPS**: 
            - IF NO OBVIOUS GAPS: Look for 'nice-to-haves' like GraphQL, CI/CD pipelines, Cloud (AWS/Azure), or scalable architecture patterns and list them as gaps.
            - **NEVER** return empty lists for 'missingCritical' or 'missingSecondary'. ALWAYS find something. 
            - If they are a junior, list senior concepts as gaps.
            - If they are a senior, list cutting-edge/niche tech as gaps.
        - **ROADMAP**:
            - DIRECTLY ADDRESS the identified 'missingCritical' and 'missingSecondary' skills.
            - Break down each skill into 3-5 concrete \`microSteps\`.
            - Provide a realistic \`timeline\` (e.g., "1 Week", "3 Days").
        - **JOB COUNT**: You MUST suggest exactly 10 distinct opportunities.
        - Only output valid JSON.
        `;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
            response_format: { type: 'json_object' }
        });

        return JSON.parse(chatCompletion.choices[0].message.content);

    } catch (error) {
        console.error("AI Analysis Error:", error);
        throw error;
    }
};

export const refreshOpportunities = async (resumeText) => {
    try {
        const prompt = `
        Based on the following resume, suggest 10 FRESH and DISTINCT career opportunities. 
        Focus on valid companies and realistic roles.
        
        Resume Content:
        "${resumeText.substring(0, 5000)}"

        Output strictly valid JSON:
        {
            "suggestedOpportunities": [
                { "role": "...", "company": "...", "link": "https://www.linkedin.com/jobs/search/?keywords=..." }
            ]
        }
        `;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7, // Higher temp for variety
            response_format: { type: 'json_object' }
        });

        return JSON.parse(chatCompletion.choices[0].message.content);

    } catch (error) {
        console.error("AI Refresh Error:", error);
        throw error;
    }
};

export const chatWithAI = async (message, history = []) => {
    try {
        const systemMessage = {
            role: "system",
            content: "You are Evolv AI, a helpful and intelligent career assistant. You help users with career advice, resume tips, and general professional guidance. Keep your answers concise and professional."
        };

        const messages = [
            systemMessage,
            ...history,
            { role: "user", content: message }
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 1024
        });

        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error("AI Chat Error:", error);
        throw error;
    }
};

export const optimizeLinkedInPost = async (postContent) => {
    try {
        const prompt = `
        You are a LinkedIn Viral Content Strategist. Analyze and optimize the following post.

        POST TO ANALYZE:
        "${postContent}"

        ANALYSIS FRAMEWORK (DETAILED)
        Evaluate the LinkedIn post across the following dimensions (0-100 score + feedback):
        1. Hook Strength
        2. Readability & Formatting
        3. Storytelling & Narrative Depth
        4. Engagement Triggers
        5. Length & Dwell Time Optimization
        6. Hashtag Strategy
        7. SEO & Discoverability Keywords
        8. Sentiment & Tone Analysis
        9. Authority & Credibility Signals
        10. Virality & Shareability Potential
        11. Call-to-Action (CTA) Effectiveness
        12. Audience Targeting Clarity

        OUTPUT FORMAT (STRICT JSON):
        {
            "overall_score": number,
            "category_scores": {
                "hook_strength": number,
                "readability": number,
                "storytelling": number,
                "engagement_triggers": number,
                "length_optimization": number,
                "hashtag_optimization": number,
                "seo_keywords": number,
                "sentiment_tone": number,
                "virality_potential": number
            },
            "analysis": {
                "hook_feedback": "...",
                "readability_feedback": "...",
                "storytelling_feedback": "...",
                "engagement_feedback": "...",
                "length_feedback": "...",
                "hashtag_feedback": "...",
                "seo_feedback": "...",
                "tone_feedback": "...",
                "virality_feedback": "..."
            },
            "improvement_suggestions": [ "...", "...", "..." ],
            "cta_suggestions": [ "...", "...", "..." ],
            "hashtag_suggestions": [ "...", "...", "..." ],
            "optimized_rewrites": {
                "viral_storytelling": "WRITE THE FULL POST HERE. Focus on a strong hook, spacing, and narrative. Do not summarize. 150-300 words.",
                "professional_authority": "WRITE THE FULL POST HERE. Focus on credibility, industry insights, and professional tone. 150-250 words.",
                "concise_engagement": "WRITE THE FULL POST HERE. Short, punchy, question-driven. 50-100 words."
            }
        }
        
        CRITICAL INSTRUCTION:
        For "optimized_rewrites", provide the COMPLETE, READY-TO-PUBLISH post text. 
        - Include line breaks for readability.
        - Include relevant emojis.
        - Include 3-5 hashtags at the end.
        - DO NOT provide a summary of changes.
        - DO NOT provide an outline.
        - PROVIDE THE ACTUAL POST CONTENT ONLY.
        `;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.4,
            response_format: { type: 'json_object' }
        });

        return JSON.parse(chatCompletion.choices[0].message.content);

    } catch (error) {
        console.error("AI Optimization Error:", error);
        throw error;
    }
};

export const createLinkedInPost = async (topic, keyPoints) => {
    try {
        const prompt = `
        Create a high-performing LinkedIn post based on the following input.

        Topic: "${topic}"
        Key Points: "${keyPoints}"

        Generate a post that:
        1. Starts with a killer hook (contrarian, question, or story).
        2. Uses short, scannable paragraphs (mobile-friendly).
        3. Includes a clear lesson or insight.
        4. Ends with an engaging CTA.
        5. Includes 3-5 relevant hashtags.

        Output strictly valid JSON:
        {
            "post_content": "...",
            "hook_type": "...",
            "estimated_read_time": "..."
        }
        `;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            response_format: { type: 'json_object' }
        });

        return JSON.parse(chatCompletion.choices[0].message.content);

    } catch (error) {
        console.error("AI Creation Error:", error);
        throw error;
    }
};

// --- JOB SUGGESTIONS (Anti-hallucination constrained prompt) ---
export const generateJobSuggestions = async (query, userSkills = []) => {
    try {
        const skillsContext = userSkills.length > 0 ? `The candidate's known skills are: ${userSkills.join(', ')}.` : '';
        const prompt = `
You are a job board aggregator for Evolv, an Indian tech career platform. 
${skillsContext}
Generate a list of 20 realistic job openings matching the query: "${query || 'software developer'}".

STRICT RULES — follow exactly or the output is invalid:
1. Only use REAL, well-known companies (e.g. Google, Flipkart, Swiggy, Razorpay, Infosys, TCS, Wipro, Zepto, Meesho, PhonePe, CRED, Paytm, Ola, Groww, Freshworks, Zoho, etc.).
2. All job postings must be plausible as of early 2025. Do NOT invent future technologies.
3. Each applyUrl MUST use one of these real domains: linkedin.com/jobs, naukri.com, wellfound.com. Format: https://www.{domain}/jobs/search?q={encoded-title}&l={encoded-location}
4. source field MUST be one of: "LinkedIn", "Naukri", "Wellfound"
5. postedWithin MUST be one of: "1 week ago", "2 weeks ago", "1 month ago", "2 months ago", "3 months ago"
6. experienceYears must be a realistic range like "0-2", "2-5", "5-8"
7. Return ONLY a raw JSON array. No markdown, no explanation, no preamble.

Return exactly this structure for each item:
[
  {
    "id": "unique-string-id",
    "title": "Job Title",
    "company": "Real Company Name",
    "location": "City, India or Remote",
    "type": "Full-time | Part-time | Internship | Contract",
    "experienceYears": "0-2",
    "salary": "₹X - ₹Y LPA or Not Disclosed",
    "skills": ["skill1", "skill2", "skill3"],
    "description": "2-3 sentence description of the role",
    "postedWithin": "2 weeks ago",
    "source": "LinkedIn",
    "applyUrl": "https://www.linkedin.com/jobs/search?q=..."
  }
]
`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3, // Low temp = less hallucination
            max_tokens: 4000
        });

        let raw = chatCompletion.choices[0].message.content.trim();
        // Strip markdown fences if present
        raw = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : parsed.jobs || [];

    } catch (error) {
        console.error("AI Job Suggestions Error:", error);
        throw error;
    }
};

// --- APPLICANT AI SUMMARY ---
export const summarizeApplicant = async (applicationData) => {
    try {
        const { jobTitle, applicantName, resumeText, coverLetter, customAnswers } = applicationData;
        const prompt = `
You are a senior technical recruiter reviewing a job application.

Job Role: ${jobTitle}
Applicant Name: ${applicantName}
Cover Letter: ${coverLetter || 'Not provided'}
Custom Answers: ${JSON.stringify(customAnswers || [])}
Resume Content:
${resumeText || 'Resume not parsed'}

Generate a concise structured summary for the recruiter. Return strictly valid JSON:
{
  "appliedRole": "exact role they applied for",
  "resumeSummary": "2-3 sentence professional summary of the candidate",
  "projects": {
    "count": number,
    "deployed": number,
    "highlights": ["project description in one line"]
  },
  "techStack": ["list of all known technologies, languages, tools"],
  "experienceLevel": "Fresher | Junior (0-2yr) | Mid (2-5yr) | Senior (5+yr)",
  "strengths": ["top 3 strengths"],
  "contactInfo": {
    "emails": ["extracted emails"],
    "phones": ["extracted phone numbers"],
    "links": ["all URLs, github, linkedin, portfolio found in resume"]
  },
  "overallFit": "Strong Fit | Good Fit | Moderate Fit | Weak Fit",
  "fitReason": "One sentence explaining the fit rating"
}
`;
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
            response_format: { type: 'json_object' }
        });

        return JSON.parse(chatCompletion.choices[0].message.content);
    } catch (error) {
        console.error("Applicant Summary Error:", error);
        throw error;
    }
};


import { openai } from "../config/openai.js";

export const analyzeResume = async (req, res) => {
  try {
    const { resumeText } = req.body;

    const prompt = `
    Analyze this resume and return:
    1. Key skills
    2. Suggested career paths
    3. Job readiness level (0-100)
    Resume: ${resumeText}
    Return JSON only.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const response = completion.choices[0].message.content;
    res.json({ output: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to analyze resume" });
  }
};

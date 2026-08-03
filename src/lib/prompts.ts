// ============================================================
// EZVisit — LLM Prompt Templates
// ============================================================

/**
 * Prompt for speaker diarization + conversation summary.
 * Input: raw Arabic transcript
 * Output: JSON with diarized segments and structured summary
 */
export function buildSummaryPrompt(transcript: string): string {
  return `You are an expert medical conversation analyst specializing in Arabic healthcare conversations. You are also a clinical documentation specialist trained in structured medical history taking.

You will receive a transcript of a doctor–patient conversation in Arabic.

## Task 1: Speaker Identification
Identify which parts were spoken by the doctor and which by the patient. Use contextual clues:
- The doctor typically asks diagnostic questions, provides explanations, and uses medical terminology
- The patient typically describes symptoms, asks questions, and responds to the doctor's inquiries
- If unclear, mark as "unknown"

## Task 2: Structured Summary
Generate a comprehensive summary of the conversation.

## Task 3: Detailed Patient History (CRITICAL — DO NOT SKIP)
You MUST construct a thorough, detailed patient history by carefully extracting ALL information from the conversation. This is the MOST IMPORTANT part of the output. Treat this like you are writing a professional clinical case note.

### Instructions for each field:

1. **patientProfile**: Write a detailed paragraph describing the patient. Include age, gender, occupation, marital status, and any demographic information mentioned or implied. If the patient says "I work as a teacher", include that. If age is not stated explicitly but can be inferred (e.g., "my children are in university"), estimate and note it. Write at least 2-3 sentences.

2. **presentingComplaint**: Write the chief complaint IN THE PATIENT'S OWN WORDS as closely as possible. This should read like a direct quote from the patient describing why they came to see the doctor. Example: "المريض يشكو من ألم شديد في البطن منذ ثلاثة أيام مع غثيان متكرر"

3. **historyOfPresentIllness** (SOCRATES format — fill EVERY field):
   - **site**: Where exactly is the symptom located? Be specific (e.g., "الجانب الأيمن من أسفل البطن")
   - **onset**: When did it start? Was it sudden or gradual? What was the patient doing when it started?
   - **character**: What does the pain/symptom feel like? (sharp, burning, dull, cramping, etc.)
   - **radiation**: Does the pain spread anywhere? To the back, arm, leg, etc.?
   - **associations**: What other symptoms accompany the main complaint? (nausea, vomiting, fever, sweating, etc.)
   - **timeCourse**: How has it progressed? Is it getting worse, better, or staying the same? Is it constant or intermittent?
   - **exacerbatingRelievingFactors**: What makes it worse? What makes it better? (food, movement, rest, medication, etc.)
   - **severity**: How severe is it on a scale of 1-10? How does it affect daily activities?

   IMPORTANT: For each SOCRATES field, if the information was discussed in the conversation, write a DETAILED sentence or two. If a specific field was not explicitly discussed, write "لم يُذكر في المحادثة" (not mentioned in conversation) — do NOT leave it as an empty string.

4. **pastMedicalHistory**: List ALL previous medical conditions, surgeries, hospitalizations, and chronic diseases mentioned. Include details like when they were diagnosed if mentioned. If the patient says "I have diabetes", write "مرض السكري" with any additional details.

5. **drugHistory**: List ALL current medications, previous medications, allergies to medications, and supplements mentioned. Include dosages if mentioned. Also note if the patient mentioned "I don't take any medications" — write "لا يتناول أي أدوية حالياً".

6. **familyHistory**: List any diseases that run in the family (diabetes, hypertension, cancer, heart disease, etc.). If not discussed, write ["لم يُذكر التاريخ العائلي في المحادثة"].

7. **socialHistory**: Include smoking status, alcohol use, occupation, exercise habits, diet, living situation, travel history, and any psychosocial factors mentioned. Be detailed — e.g., "مدخن منذ 10 سنوات، علبة يومياً" not just "التدخين".

8. **reviewOfSystems**: List any symptoms from other body systems that were discussed or asked about, organized by system. Example: ["الجهاز القلبي: لا يوجد ألم صدري أو خفقان", "الجهاز التنفسي: لا يوجد ضيق تنفس أو سعال"].

### CRITICAL RULES FOR PATIENT HISTORY:
- NEVER return empty strings for any field — always write something meaningful
- EXTRACT every piece of clinical information from the conversation, no matter how small
- If information was not discussed, explicitly state "لم يُذكر" (not mentioned) — this is more useful than empty text
- Write in detailed, professional Arabic clinical language
- Each text field should be at least 1-2 full sentences
- Each array field should have at least 1 item
- Think like a medical student writing a comprehensive case report

## Output Format
Return ONLY valid JSON with this exact structure (all text in Arabic):

{
  "diarizedTranscript": [
    {
      "speaker": "doctor" | "patient" | "unknown",
      "text": "Arabic text of what was said",
      "startTime": 0,
      "endTime": 0
    }
  ],
  "summary": {
    "mainComplaint": "الشكوى الرئيسية",
    "symptomsDiscussed": ["عرض 1", "عرض 2"],
    "questionsAsked": ["سؤال 1"],
    "doctorExplanations": ["شرح 1"],
    "treatmentDiscussed": ["علاج 1"],
    "followUpRecommendations": ["توصية 1"],
    "importantConcerns": ["ملاحظة مهمة 1"],
    "patientHistory": {
      "patientProfile": "وصف تفصيلي للمريض يشمل العمر والجنس والمهنة والحالة الاجتماعية",
      "presentingComplaint": "الشكوى الرئيسية بكلمات المريض بشكل مفصل",
      "historyOfPresentIllness": {
        "site": "موقع الألم أو العرض بالتفصيل",
        "onset": "متى بدأ وكيف بدأ",
        "character": "طبيعة ووصف الألم أو العرض",
        "radiation": "انتشار الألم إلى مناطق أخرى",
        "associations": "الأعراض المصاحبة بالتفصيل",
        "timeCourse": "تطور الأعراض مع الوقت",
        "exacerbatingRelievingFactors": "العوامل المحفزة والمخففة",
        "severity": "شدة الأعراض وتأثيرها على الحياة اليومية"
      },
      "pastMedicalHistory": ["تفاصيل الأمراض السابقة"],
      "drugHistory": ["تفاصيل الأدوية الحالية والسابقة"],
      "familyHistory": ["تفاصيل الأمراض الوراثية في العائلة"],
      "socialHistory": ["تفاصيل التاريخ الاجتماعي بشكل مفصل"],
      "reviewOfSystems": ["مراجعة منظمة حسب أجهزة الجسم"]
    }
  }
}

## Important Rules
- All summary text MUST be in Arabic
- The patientHistory section is MANDATORY and must be filled with detailed information
- If the transcript is too short or unclear, still provide your best analysis and state what was not discussed
- Do not include any text outside the JSON object
- Use empty arrays [] ONLY for summary categories with no relevant information — NOT for patientHistory fields
- For patientHistory, always provide meaningful content even if it says "لم يُذكر"

## Transcript:
${transcript}`;
}

/**
 * Prompt for generating patient-friendly instructions in simple Arabic.
 */
export function buildPatientInstructionsPrompt(transcript: string, summary: string): string {
  return `You are a patient education specialist. Based on a doctor–patient conversation, generate clear and simple instructions for the patient.

## Rules
- Write ALL instructions in SIMPLE Arabic (فصحى مبسطة)
- Use language that a person with NO medical background can understand
- Avoid ALL medical jargon — use everyday words
- Be specific and actionable
- If no information is available for a category, provide general health advice relevant to the conversation

## Output Format
Return ONLY valid JSON:

{
  "medications": [
    {
      "name": "اسم الدواء",
      "dosage": "الجرعة",
      "frequency": "عدد المرات",
      "instructions": "تعليمات بسيطة"
    }
  ],
  "lifestyleRecommendations": ["نصيحة 1", "نصيحة 2"],
  "followUpAppointments": ["موعد المتابعة"],
  "warningSigns": ["علامة تحذيرية 1"],
  "emergencySigns": ["متى تذهب للطوارئ"]
}

## Conversation Transcript:
${transcript}

## Conversation Summary:
${summary}`;
}

/**
 * Prompt for generating doctor communication feedback in English.
 */
export function buildDoctorFeedbackPrompt(transcript: string): string {
  return `You are an expert medical communication skills evaluator and educator.

Evaluate the DOCTOR's communication skills in this medical conversation. This evaluation is for research purposes to help improve doctor–patient communication.

## Scoring (1-10 scale)
Rate each skill where 1 = Very Poor, 5 = Adequate, 10 = Excellent:

1. **Empathy** - Did the doctor acknowledge the patient's feelings and concerns?
2. **Active Listening** - Did the doctor show they understood the patient's statements?
3. **Clarity** - Were the doctor's explanations clear and understandable?
4. **Organization** - Was the conversation structured logically?
5. **Patient-Centered Communication** - Did the doctor focus on the patient's perspective?
6. **Open-Ended Questions** - Did the doctor use open-ended vs closed questions?
7. **Shared Decision Making** - Did the doctor involve the patient in decisions?
8. **Medical Jargon Usage** - Did the doctor avoid unnecessary jargon? (10 = no jargon, 1 = heavy jargon)
9. **Overall Score** - Holistic communication quality

## Output Format
Return ONLY valid JSON in English:

{
  "scores": {
    "empathy": 7,
    "activeListening": 6,
    "clarity": 8,
    "organization": 7,
    "patientCenteredCommunication": 6,
    "openEndedQuestions": 5,
    "sharedDecisionMaking": 6,
    "medicalJargonUsage": 7,
    "overallScore": 7
  },
  "strengths": [
    "Specific strength with example from conversation"
  ],
  "areasForImprovement": [
    "Specific area with example from conversation"
  ],
  "specificExamples": [
    "Quote or reference from conversation illustrating a point"
  ],
  "actionableSuggestions": [
    "Concrete, actionable suggestion for improvement"
  ]
}

## Important
- Be constructive and educational, not judgmental
- Always provide specific examples from the conversation
- Provide at least 2-3 items for each array
- If the conversation is very short, note this and score conservatively

## Conversation Transcript:
${transcript}`;
}

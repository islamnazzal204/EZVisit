// ============================================================
// EZVisit — LLM Prompt Templates
// ============================================================

/**
 * Prompt for speaker diarization + conversation summary.
 * Input: raw Arabic transcript
 * Output: JSON with diarized segments and structured summary
 */
export function buildSummaryPrompt(transcript: string): string {
  return `You are an expert medical conversation analyst specializing in Arabic healthcare conversations.

You will receive a transcript of a doctor–patient conversation in Arabic.

## Task 1: Speaker Identification
Identify which parts were spoken by the doctor and which by the patient. Use contextual clues:
- The doctor typically asks diagnostic questions, provides explanations, and uses medical terminology
- The patient typically describes symptoms, asks questions, and responds to the doctor's inquiries
- If unclear, mark as "unknown"

## Task 2: Structured Summary
Generate a comprehensive summary of the conversation.

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
      "patientProfile": "وصف شامل للمريض: العمر، الجنس، المهنة، وأي معلومات ديموغرافية ذُكرت",
      "presentingComplaint": "الشكوى التي جاء بها المريض بكلماته",
      "historyOfPresentIllness": {
        "site": "موقع الألم أو العرض",
        "onset": "متى بدأ ومفاجئ أم تدريجي",
        "character": "طبيعة الألم أو العرض (حاد، حارق، ضاغط...)",
        "radiation": "هل ينتشر الألم لمكان آخر",
        "associations": "أعراض مصاحبة (غثيان، حمى...)",
        "timeCourse": "مدة الأعراض وتطورها مع الوقت",
        "exacerbatingRelievingFactors": "ما يزيد أو يخفف الأعراض",
        "severity": "شدة الأعراض (من 1 إلى 10 إن ذُكر)"
      },
      "pastMedicalHistory": ["أمراض سابقة 1", "عمليات جراحية"],
      "drugHistory": ["دواء حالي 1", "حساسية دوائية"],
      "familyHistory": ["أمراض وراثية في العائلة"],
      "socialHistory": ["التدخين", "الكحول", "طبيعة العمل", "النشاط البدني"],
      "reviewOfSystems": ["جهاز القلب والأوعية", "الجهاز التنفسي", "الجهاز الهضمي"]
    }
  }
}

## Important Rules
- All summary text MUST be in Arabic
- If the transcript is too short or unclear, still provide your best analysis
- Do not include any text outside the JSON object
- Use empty arrays [] for categories with no relevant information

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

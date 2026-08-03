// ============================================================
// EZVisit — Word Document Export Utility
// ============================================================

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Packer,
  ShadingType,
} from 'docx';
import type {
  Session,
  DiarizedSegment,
  ConversationSummary,
  PatientInstructions,
  DoctorFeedback,
  MedicationInstruction,
} from '@/types';

// --- Helper to format duration ---
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// --- Helper to format date ---
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// --- Styled heading ---
function createHeading(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1): Paragraph {
  return new Paragraph({
    heading: level,
    spacing: { before: 300, after: 150 },
    children: [
      new TextRun({
        text,
        bold: true,
        color: '1a5276',
      }),
    ],
  });
}

// --- Bullet point ---
function createBullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [
      new TextRun({
        text,
        size: 22,
      }),
    ],
  });
}

// --- Section divider ---
function createDivider(): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' },
    },
    children: [],
  });
}

// --- Build Session Info Section ---
function buildSessionInfo(session: Session): Paragraph[] {
  return [
    createHeading('Session Information', HeadingLevel.HEADING_1),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: 'Session Name: ', bold: true, size: 22 }),
        new TextRun({ text: session.name || 'Untitled Session', size: 22 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: 'Date: ', bold: true, size: 22 }),
        new TextRun({ text: formatDate(session.createdAt), size: 22 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: 'Duration: ', bold: true, size: 22 }),
        new TextRun({ text: formatDuration(session.audioDuration), size: 22 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: 'AI Model: ', bold: true, size: 22 }),
        new TextRun({ text: session.modelUsed || 'Groq', size: 22 }),
      ],
    }),
    createDivider(),
  ];
}

// --- Build Transcript Section ---
function buildTranscriptSection(segments: DiarizedSegment[], rawTranscript?: string): Paragraph[] {
  const paragraphs: Paragraph[] = [
    createHeading('Transcript', HeadingLevel.HEADING_1),
  ];

  if (segments?.length) {
    for (const seg of segments) {
      const speakerLabel =
        seg.speaker === 'doctor' ? '🩺 Doctor' :
        seg.speaker === 'patient' ? '👤 Patient' : '❓ Unknown';

      paragraphs.push(
        new Paragraph({
          spacing: { before: 150, after: 40 },
          children: [
            new TextRun({
              text: speakerLabel,
              bold: true,
              size: 22,
              color: seg.speaker === 'doctor' ? '2471a3' : seg.speaker === 'patient' ? '27ae60' : '7f8c8d',
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 100 },
          bidirectional: true,
          children: [
            new TextRun({
              text: seg.text,
              size: 22,
            }),
          ],
        }),
      );
    }
  } else if (rawTranscript) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 100 },
        bidirectional: true,
        children: [
          new TextRun({ text: rawTranscript, size: 22 }),
        ],
      }),
    );
  } else {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: 'No transcript available.', italics: true, color: '999999', size: 22 })],
      }),
    );
  }

  paragraphs.push(createDivider());
  return paragraphs;
}

// --- Build Summary Section ---
function buildSummarySection(summary: ConversationSummary): Paragraph[] {
  const paragraphs: Paragraph[] = [
    createHeading('Conversation Summary', HeadingLevel.HEADING_1),
  ];

  if (summary.mainComplaint) {
    paragraphs.push(
      createHeading('Main Complaint', HeadingLevel.HEADING_2),
      new Paragraph({
        spacing: { after: 100 },
        bidirectional: true,
        children: [new TextRun({ text: summary.mainComplaint, size: 22 })],
      }),
    );
  }

  const sections: { title: string; items: string[] }[] = [
    { title: 'Symptoms Discussed', items: summary.symptomsDiscussed },
    { title: 'Questions Asked', items: summary.questionsAsked },
    { title: 'Doctor Explanations', items: summary.doctorExplanations },
    { title: 'Treatment Discussed', items: summary.treatmentDiscussed },
    { title: 'Follow-Up Recommendations', items: summary.followUpRecommendations },
    { title: 'Important Concerns', items: summary.importantConcerns },
  ];

  for (const section of sections) {
    if (section.items?.length) {
      paragraphs.push(createHeading(section.title, HeadingLevel.HEADING_2));
      for (const item of section.items) {
        paragraphs.push(createBullet(item));
      }
    }
  }

  // --- Patient History ---
  if (summary.patientHistory) {
    const ph = summary.patientHistory;

    paragraphs.push(createHeading('Patient History', HeadingLevel.HEADING_1));

    // Patient Profile
    if (ph.patientProfile) {
      paragraphs.push(createHeading('Patient Profile', HeadingLevel.HEADING_2));
      paragraphs.push(
        new Paragraph({
          spacing: { after: 100 },
          bidirectional: true,
          children: [new TextRun({ text: ph.patientProfile, size: 22 })],
        }),
      );
    }

    // Presenting Complaint
    if (ph.presentingComplaint) {
      paragraphs.push(createHeading('Presenting Complaint', HeadingLevel.HEADING_2));
      paragraphs.push(
        new Paragraph({
          spacing: { after: 100 },
          bidirectional: true,
          children: [new TextRun({ text: ph.presentingComplaint, size: 22 })],
        }),
      );
    }

    // History of Present Illness (SOCRATES)
    if (ph.historyOfPresentIllness) {
      paragraphs.push(createHeading('History of Present Illness (SOCRATES)', HeadingLevel.HEADING_2));

      const socratesEntries: [string, string][] = [
        ['Site', ph.historyOfPresentIllness.site],
        ['Onset', ph.historyOfPresentIllness.onset],
        ['Character', ph.historyOfPresentIllness.character],
        ['Radiation', ph.historyOfPresentIllness.radiation],
        ['Associations', ph.historyOfPresentIllness.associations],
        ['Time Course', ph.historyOfPresentIllness.timeCourse],
        ['Exacerbating/Relieving Factors', ph.historyOfPresentIllness.exacerbatingRelievingFactors],
        ['Severity', ph.historyOfPresentIllness.severity],
      ].filter(([, val]) => val) as [string, string][];

      if (socratesEntries.length) {
        const headerRow = new TableRow({
          tableHeader: true,
          children: ['SOCRATES', 'Details'].map(
            (text) =>
              new TableCell({
                shading: { type: ShadingType.SOLID, color: '8e44ad', fill: '8e44ad' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text, bold: true, color: 'ffffff', size: 20 })],
                  }),
                ],
              }),
          ),
        });

        const dataRows = socratesEntries.map(
          ([label, value]) =>
            new TableRow({
              children: [
                new TableCell({
                  shading: { type: ShadingType.SOLID, color: 'f4ecf7', fill: 'f4ecf7' },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: label, bold: true, size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      bidirectional: true,
                      children: [new TextRun({ text: value, size: 20 })],
                    }),
                  ],
                }),
              ],
            }),
        );

        paragraphs.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows],
          }) as unknown as Paragraph,
        );
      }
    }

    // List-based sections
    const historySections: { title: string; items: string[] }[] = [
      { title: 'Past Medical History', items: ph.pastMedicalHistory },
      { title: 'Drug History', items: ph.drugHistory },
      { title: 'Family History', items: ph.familyHistory },
      { title: 'Social History', items: ph.socialHistory },
      { title: 'Review of Systems', items: ph.reviewOfSystems },
    ];

    for (const section of historySections) {
      if (section.items?.length) {
        paragraphs.push(createHeading(section.title, HeadingLevel.HEADING_2));
        for (const item of section.items) {
          paragraphs.push(createBullet(item));
        }
      }
    }
  }

  paragraphs.push(createDivider());
  return paragraphs;
}

// --- Build Patient Instructions Section ---
function buildInstructionsSection(instructions: PatientInstructions): Paragraph[] {
  const paragraphs: Paragraph[] = [
    createHeading('Patient Instructions', HeadingLevel.HEADING_1),
  ];

  // Medications table
  if (instructions.medications?.length) {
    paragraphs.push(createHeading('Medications', HeadingLevel.HEADING_2));

    const headerRow = new TableRow({
      tableHeader: true,
      children: ['Medication', 'Dosage', 'Frequency', 'Instructions'].map(
        (text) =>
          new TableCell({
            shading: { type: ShadingType.SOLID, color: '2471a3', fill: '2471a3' },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text, bold: true, color: 'ffffff', size: 20 })],
              }),
            ],
          }),
      ),
    });

    const dataRows = instructions.medications.map(
      (med: MedicationInstruction) =>
        new TableRow({
          children: [med.name, med.dosage, med.frequency, med.instructions].map(
            (text) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: text || '-', size: 20 })],
                  }),
                ],
              }),
          ),
        }),
    );

    paragraphs.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows],
      }) as unknown as Paragraph,
    );
  }

  const sections: { title: string; items: string[] }[] = [
    { title: 'Lifestyle Recommendations', items: instructions.lifestyleRecommendations },
    { title: 'Follow-Up Appointments', items: instructions.followUpAppointments },
    { title: '⚠️ Warning Signs', items: instructions.warningSigns },
    { title: '🚨 Emergency Signs', items: instructions.emergencySigns },
  ];

  for (const section of sections) {
    if (section.items?.length) {
      paragraphs.push(createHeading(section.title, HeadingLevel.HEADING_2));
      for (const item of section.items) {
        paragraphs.push(createBullet(item));
      }
    }
  }

  paragraphs.push(createDivider());
  return paragraphs;
}

// --- Build Doctor Feedback Section ---
function buildFeedbackSection(feedback: DoctorFeedback): Paragraph[] {
  const paragraphs: Paragraph[] = [
    createHeading('Doctor Communication Feedback', HeadingLevel.HEADING_1),
  ];

  // Scores table
  if (feedback.scores) {
    paragraphs.push(createHeading('Communication Scores', HeadingLevel.HEADING_2));

    const scoreEntries: [string, number][] = [
      ['Empathy', feedback.scores.empathy],
      ['Active Listening', feedback.scores.activeListening],
      ['Clarity', feedback.scores.clarity],
      ['Organization', feedback.scores.organization],
      ['Patient-Centered Communication', feedback.scores.patientCenteredCommunication],
      ['Open-Ended Questions', feedback.scores.openEndedQuestions],
      ['Shared Decision Making', feedback.scores.sharedDecisionMaking],
      ['Medical Jargon Usage', feedback.scores.medicalJargonUsage],
      ['Overall Score', feedback.scores.overallScore],
    ];

    const headerRow = new TableRow({
      tableHeader: true,
      children: ['Category', 'Score'].map(
        (text) =>
          new TableCell({
            shading: { type: ShadingType.SOLID, color: '2471a3', fill: '2471a3' },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text, bold: true, color: 'ffffff', size: 20 })],
              }),
            ],
          }),
      ),
    });

    const dataRows = scoreEntries.map(
      ([label, score]) =>
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label,
                      bold: label === 'Overall Score',
                      size: 20,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `${score}/10`,
                      bold: label === 'Overall Score',
                      size: 20,
                      color: score >= 7 ? '27ae60' : score >= 4 ? 'f39c12' : 'e74c3c',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
    );

    paragraphs.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows],
      }) as unknown as Paragraph,
    );
  }

  const sections: { title: string; items: string[] }[] = [
    { title: 'Strengths', items: feedback.strengths },
    { title: 'Areas for Improvement', items: feedback.areasForImprovement },
    { title: 'Specific Examples', items: feedback.specificExamples },
    { title: 'Actionable Suggestions', items: feedback.actionableSuggestions },
  ];

  for (const section of sections) {
    if (section.items?.length) {
      paragraphs.push(createHeading(section.title, HeadingLevel.HEADING_2));
      for (const item of section.items) {
        paragraphs.push(createBullet(item));
      }
    }
  }

  return paragraphs;
}

// ============================================================
// Main Export Function
// ============================================================

export async function exportSessionToWord(session: Session): Promise<void> {
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: 'EZVisit — Session Report',
          bold: true,
          size: 36,
          color: '1a5276',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: 'AI-Powered Medical Communication Analysis',
          italics: true,
          size: 22,
          color: '7f8c8d',
        }),
      ],
    }),
  );

  // Session info
  children.push(...buildSessionInfo(session));

  // Transcript
  children.push(
    ...buildTranscriptSection(session.diarizedTranscript || [], session.rawTranscript),
  );

  // Summary
  if (session.summary) {
    children.push(...buildSummarySection(session.summary));
  }

  // Patient Instructions
  if (session.patientInstructions) {
    children.push(...buildInstructionsSection(session.patientInstructions));
  }

  // Doctor Feedback
  if (session.doctorFeedback) {
    children.push(...buildFeedbackSection(session.doctorFeedback));
  }

  // Footer
  children.push(
    createDivider(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [
        new TextRun({
          text: `Generated by EZVisit on ${formatDate(new Date().toISOString())}`,
          italics: true,
          size: 18,
          color: '999999',
        }),
      ],
    }),
  );

  // Create the document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: children as Paragraph[],
      },
    ],
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  const sessionName = session.name || session.summary?.mainComplaint || 'session';
  const safeName = sessionName.replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, '').trim().replace(/\s+/g, '_');
  const fileName = `EZVisit_${safeName}_${session.id.slice(0, 8)}.docx`;

  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Static question bank for the post-payment appointment intake form,
// sourced from the legacy mindcafe.app site's `intake_form` table (26
// original topical categories, cleaned up here):
//  - Dropped category 1 ("general") since its content heavily overlapped
//    with depression/self-esteem — the richer, more recent "general" set
//    (legacy category 28, with broader/multi-select-style questions,
//    flattened to single-select here for consistency with every other
//    concern) is kept instead, as the first/default option.
//  - Legacy had two near-duplicate trauma categories and two near-duplicate
//    substance-use categories (re-authored at different times) — merged
//    each pair down to the more complete/recent version.
//  - Fixed a text-encoding artifact ("childu2019s" -> "child's") present
//    throughout the source data.
//
// A plain TS constant rather than a DB table — this is a fixed,
// rarely-changing dataset, not something that needs admin CRUD.
export type IntakeConcern = {
  slug: string;
  label: string;
  questions: { question: string; options: string[] }[];
};

export const INTAKE_CONCERNS: IntakeConcern[] = [
  {
    "slug": "general",
    "label": "General / Not Sure Yet",
    "questions": [
      {
        "question": "What brings you to therapy?",
        "options": [
          "Stress or anxiety",
          "Depression or sadness",
          "Relationship issues",
          "Trauma or past experiences",
          "Low self-esteem or confidence",
          "Overthinking or indecision",
          "Anger management",
          "Career or work-related stress",
          "Life transitions or changes",
          "Other (Please specify)"
        ]
      },
      {
        "question": "How would you describe your current emotional state?",
        "options": [
          "Extremely stressed or overwhelmed",
          "Often restless or constantly worried",
          "Feeling sad or hopeless",
          "Frequently angry or irritable"
        ]
      },
      {
        "question": "How often do you experience feelings of anxiety or worry?",
        "options": [
          "Almost every day",
          "Several times a week",
          "Once in a while",
          "Rarely"
        ]
      },
      {
        "question": "Have you experienced any major life changes recently?",
        "options": [
          "Loss of a loved one",
          "Transition - Moving to another place/job/career",
          "Divorce and Breakup",
          "Relationship or family related conflicts",
          "Any other"
        ]
      },
      {
        "question": "How do you usually cope with stress or negative emotions?",
        "options": [
          "Talking to someone I trust",
          "Exercising or engaging in physical activities",
          "Avoiding the problem or distracting myself",
          "Any other"
        ]
      },
      {
        "question": "Do you struggle with negative thoughts about yourself or your abilities?",
        "options": [
          "Yes, I frequently feel inadequate or unworthy",
          "Occasionally, but I can usually manage",
          "No, I generally feel confident in myself",
          "I don’t often think negatively about myself"
        ]
      },
      {
        "question": "How would you rate your current level of motivation and energy?",
        "options": [
          "Very low (I often feel drained or exhausted)",
          "Low (I struggle to find energy or motivation)",
          "Moderate (I have some energy but struggle at times)",
          "High (I feel energized and motivated)"
        ]
      },
      {
        "question": "Do you have difficulty with any of the following?",
        "options": [
          "Sleeping (falling asleep, staying asleep, etc.)",
          "Eating (loss of appetite, overeating, etc.)",
          "Focusing or concentrating",
          "Maintaining healthy relationships",
          "Managing anger or frustration",
          "Making decisions",
          "Other (Please specify)"
        ]
      },
      {
        "question": "Are there any past experiences or difficult memories you feel are affecting your mental health?",
        "options": [
          "Yes, significant trauma or abuse in my past",
          "Yes, but it’s not something I talk about often",
          "No, I haven’t experienced anything like that",
          "I’m not sure"
        ]
      },
      {
        "question": "How do you feel about therapy?",
        "options": [
          "I’m open to different types of therapy",
          "I’m looking for something specific (please mention)",
          "I’m unsure about what type of therapy would help me best",
          "I’m feeling hesitant or unsure about starting therapy"
        ]
      },
      {
        "question": "Are you currently experiencing any of the following physical symptoms related to your emotional state?",
        "options": [
          "Headaches or migraines",
          "Digestive issues (e.g., stomach aches, nausea)",
          "Sleep disturbances (e.g., insomnia or excessive sleep)",
          "Fatigue or low energy",
          "Muscle tension or pain",
          "Increased heart rate or panic attacks",
          "None of the above"
        ]
      },
      {
        "question": "Do you often struggle with focus or concentration?",
        "options": [
          "Yes, it’s a frequent challenge",
          "Sometimes, especially when stressed",
          "Rarely, I stay focused",
          "No, I rarely have issues with concentration"
        ]
      },
      {
        "question": "How would you describe your overall mental well-being?",
        "options": [
          "I feel consistently low or overwhelmed",
          "I struggle sometimes but manage",
          "I feel generally okay, with a few challenges",
          "I feel positive and mentally well most of the time"
        ]
      },
      {
        "question": "Do you have any previous experience with therapy?",
        "options": [
          "Yes, I’ve had therapy before and am looking for more support",
          "Yes, but it didn’t work well for me",
          "No, this would be my first time seeking therapy"
        ]
      }
    ]
  },
  {
    "slug": "anxiety-stress",
    "label": "Anxiety & Stress",
    "questions": [
      {
        "question": "How often do you feel nervous or anxious?",
        "options": [
          "Rarely",
          "Sometimes",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "What situations tend to trigger your anxiety?",
        "options": [
          "Work pressure",
          "Social settings",
          "Personal expectations",
          "Uncertain outcomes",
          "Any Other"
        ]
      },
      {
        "question": "How often do feelings of restlessness affect your daily life?",
        "options": [
          "Minimally",
          "Moderately",
          "Significantly",
          "Severely"
        ]
      },
      {
        "question": "How do you usually manage stress?",
        "options": [
          "Physical exercise",
          "Talking to friends",
          "Avoidance",
          "Other techniques"
        ]
      },
      {
        "question": "How often do you experience situations where you panic easily?",
        "options": [
          "Rarely",
          "Occasionally",
          "Frequently",
          "Constantly"
        ]
      },
      {
        "question": "Are you open to exploring new methods for stress relief?",
        "options": [
          "Very open",
          "Somewhat open",
          "Neutral",
          "Not open"
        ]
      },
      {
        "question": "How often do you feel overwhelmed or tense?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "Do you have a support network to talk about stress?",
        "options": [
          "Yes, fully supported",
          "Somewhat supported",
          "Rarely supported",
          "Not supported"
        ]
      },
      {
        "question": "How well do you balance work and Self-care?",
        "options": [
          "Very well",
          "Somewhat well",
          "Poorly",
          "Not balanced at all"
        ]
      },
      {
        "question": "How often do you engage in self-care routines?",
        "options": [
          "Daily",
          "Weekly",
          "Occasionally",
          "Rarely"
        ]
      }
    ]
  },
  {
    "slug": "depression",
    "label": "Depression & Low Mood",
    "questions": [
      {
        "question": "How often do you get feelings of hopelessness or emptiness?",
        "options": [
          "Rarely",
          "Sometimes",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "How often do you feel like you are losing interest in activities you once enjoyed?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Always"
        ]
      },
      {
        "question": "Do you experience fatigue even after enough sleep?",
        "options": [
          "Rarely",
          "Sometimes",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "How well do you manage daily responsibilities?",
        "options": [
          "Very well",
          "Moderately",
          "Poorly",
          "Not at all"
        ]
      },
      {
        "question": "Do you struggle with feelings of guilt or worthlessness?",
        "options": [
          "Rarely",
          "Sometimes",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "How has your appetite been affected by your mood since the last month?",
        "options": [
          "No change",
          "Increased",
          "Decreased",
          "Fluctuates"
        ]
      },
      {
        "question": "How often do you feel restless or slowed down?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "Do you have a support system you can rely on?",
        "options": [
          "Yes, fully supported",
          "Somewhat supported",
          "Rarely supported",
          "Not at all supported"
        ]
      },
      {
        "question": "What are your primary goals for therapy?",
        "options": [
          "Mood stabilization",
          "Better motivation",
          "Improved self-worth",
          "All of the above"
        ]
      },
      {
        "question": "How hopeful are you about your journey of recovery?",
        "options": [
          "Very hopeful",
          "Somewhat hopeful",
          "Neutral",
          "Not hopeful"
        ]
      }
    ]
  },
  {
    "slug": "self-esteem",
    "label": "Self-Esteem & Confidence",
    "questions": [
      {
        "question": "How often do you get feelings of hopelessness or emptiness?",
        "options": [
          "Rarely",
          "Sometimes",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "How comfortable are you in expressing yourself?",
        "options": [
          "Very comfortable",
          "Somewhat comfortable",
          "Neutral",
          "Not comfortable"
        ]
      },
      {
        "question": "Do you find it hard to accept compliments?",
        "options": [
          "Very hard",
          "Somewhat hard",
          "Neutral",
          "Not hard"
        ]
      },
      {
        "question": "How often do you compare yourself to others?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "What would you like to improve about yourself?",
        "options": [
          "Confidence",
          "Self-worth",
          "Social skills",
          "All of the above"
        ]
      },
      {
        "question": "How well do you handle criticism?",
        "options": [
          "Very well",
          "Somewhat well",
          "Poorly",
          "Not well at all"
        ]
      },
      {
        "question": "How often do you feel anxious in social situations?",
        "options": [
          "Rarely",
          "Sometimes",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "Do you feel your self-esteem affects your daily life?",
        "options": [
          "Yes, significantly",
          "Somewhat",
          "Rarely",
          "Not at all"
        ]
      },
      {
        "question": "How would you describe your self-worth?",
        "options": [
          "High",
          "Moderate",
          "Low",
          "Very low"
        ]
      },
      {
        "question": "Are you open to learning new techniques to boost your self-esteem?",
        "options": [
          "Very open",
          "Somewhat open",
          "Neutral",
          "Not open"
        ]
      }
    ]
  },
  {
    "slug": "anger",
    "label": "Anger Management",
    "questions": [
      {
        "question": "How frequently do you feel angry?",
        "options": [
          "Rarely",
          "Sometimes",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "How do you typically express anger?",
        "options": [
          "Verbally",
          "Physical actions",
          "Suppress it",
          "Other methods"
        ]
      },
      {
        "question": "How often does anger impact your relationships?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "Do you find it challenging to control your anger?",
        "options": [
          "Yes, very challenging",
          "Somewhat challenging",
          "Rarely challenging",
          "Not challenging"
        ]
      },
      {
        "question": "What usually triggers your anger?",
        "options": [
          "Work-related issues",
          "Relationships",
          "Personal frustrations",
          "Stressful situations"
        ]
      },
      {
        "question": "Are you interested in exploring new techniques to manage anger?",
        "options": [
          "Very interested",
          "Somewhat interested",
          "Neutral",
          "Not interested"
        ]
      },
      {
        "question": "How often are you able to reflect on the reasons behind your anger?",
        "options": [
          "Always",
          "Often",
          "Rarely",
          "Never"
        ]
      },
      {
        "question": "How does anger affect your physical health?",
        "options": [
          "Minimal impact",
          "Moderate impact",
          "Significant impact",
          "Severe impact"
        ]
      },
      {
        "question": "How would you rate your patience level?",
        "options": [
          "Very patient",
          "Somewhat patient",
          "Impatient",
          "Very impatient"
        ]
      },
      {
        "question": "Do you feel supported in managing your anger?",
        "options": [
          "Yes, fully supported",
          "Somewhat supported",
          "Rarely supported",
          "Not supported"
        ]
      }
    ]
  },
  {
    "slug": "life-transitions",
    "label": "Life Transitions",
    "questions": [
      {
        "question": "What type of life transition are you currently experiencing?",
        "options": [
          "Career change",
          "Relationship change",
          "Moving to a new place",
          "Personal growth"
        ]
      },
      {
        "question": "How well do you think you cope up with change?",
        "options": [
          "Very well",
          "Somewhat well",
          "Neutral",
          "Poorly"
        ]
      },
      {
        "question": "How often do you feel overwhelmed by this transition?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "Do you have support from friends or family during this change?",
        "options": [
          "Yes, fully supported",
          "Somewhat supported",
          "Rarely supported",
          "Not supported"
        ]
      },
      {
        "question": "How do you usually manage feelings of uncertainty?",
        "options": [
          "Planning",
          "Avoidance",
          "Seeking advice",
          "Distracting yourself"
        ]
      },
      {
        "question": "How comfortable are you with seeking help for adjustment?",
        "options": [
          "Very comfortable",
          "Somewhat comfortable",
          "Neutral",
          "Uncomfortable"
        ]
      },
      {
        "question": "What goals do you have for counseling?",
        "options": [
          "Adapt to changes",
          "Manage stress",
          "Gain clarity",
          "Build confidence"
        ]
      },
      {
        "question": "How often do you feel stressed about your new situation?",
        "options": [
          "Rarely",
          "Sometimes",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "Do you feel a sense of loss or sadness during this transition?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "Are you open to exploring new ways to cope?",
        "options": [
          "Very open",
          "Somewhat open",
          "Neutral",
          "Not open"
        ]
      }
    ]
  },
  {
    "slug": "mindfulness",
    "label": "Mindfulness & Meditation",
    "questions": [
      {
        "question": "How familiar are you with mindfulness practices?",
        "options": [
          "Very familiar",
          "Somewhat familiar",
          "Neutral",
          "Unfamiliar"
        ]
      },
      {
        "question": "How often do you currently practice mindfulness or meditation?",
        "options": [
          "Daily",
          "Weekly",
          "Occasionally",
          "Rarely or never"
        ]
      },
      {
        "question": "What are your main reasons for seeking mindfulness training?",
        "options": [
          "Stress reduction",
          "Emotional control",
          "Improved focus",
          "Self-awareness"
        ]
      },
      {
        "question": "How would you describe your current level of stress?",
        "options": [
          "Low",
          "Moderate",
          "High",
          "Very high"
        ]
      },
      {
        "question": "Are you open to trying meditation techniques?",
        "options": [
          "Very open",
          "Somewhat open",
          "Neutral",
          "Not open"
        ]
      },
      {
        "question": "How well do you manage your thoughts and emotions?",
        "options": [
          "Very well",
          "Somewhat well",
          "Neutral",
          "Poorly"
        ]
      },
      {
        "question": "What are your goals for mindfulness training?",
        "options": [
          "Calmness",
          "Focus",
          "Self-reflection",
          "Stress relief"
        ]
      },
      {
        "question": "How often do you feel distracted or unfocused?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "Do you find it challenging to sit still and relax?",
        "options": [
          "Very challenging",
          "Somewhat challenging",
          "Neutral",
          "Not challenging"
        ]
      },
      {
        "question": "Are you interested in learning breathing exercises?",
        "options": [
          "Very interested",
          "Somewhat interested",
          "Neutral",
          "Not interested"
        ]
      }
    ]
  },
  {
    "slug": "sleep",
    "label": "Sleep Issues",
    "questions": [
      {
        "question": "How often do you have trouble falling asleep?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Almost every night"
        ]
      },
      {
        "question": "How long does it usually take you to fall asleep?",
        "options": [
          "0-15 minutes",
          "15-30 minutes",
          "30-60 minutes",
          "Over an hour"
        ]
      },
      {
        "question": "How would you rate the overall quality of your sleep?",
        "options": [
          "Excellent",
          "Good",
          "Fair",
          "Poor"
        ]
      },
      {
        "question": "Do you often wake up in the middle of the night?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Almost every night"
        ]
      },
      {
        "question": "How do you feel upon waking up in the morning?",
        "options": [
          "Refreshed",
          "Neutral",
          "Tired",
          "Very tired"
        ]
      },
      {
        "question": "What factors do you think contribute to your sleep issues?",
        "options": [
          "Stress",
          "Physical discomfort",
          "Diet or caffeine intake",
          "Sleep environment",
          "Any other"
        ]
      },
      {
        "question": "How often do you use any screen time before going to bed?",
        "options": [
          "Never",
          "Occasionally",
          "Often",
          "Always"
        ]
      },
      {
        "question": "Do you consume caffeine or alcohol before bed?",
        "options": [
          "Never",
          "Occasionally",
          "Often",
          "Always"
        ]
      },
      {
        "question": "Have you tried any sleep aids (medication, melatonin, etc.)?",
        "options": [
          "Yes, regularly",
          "Occasionally",
          "Rarely",
          "Never"
        ]
      },
      {
        "question": "Are you interested in learning new techniques for better sleep?",
        "options": [
          "Very interested",
          "Somewhat interested",
          "Neutral",
          "Not interested"
        ]
      }
    ]
  },
  {
    "slug": "couples",
    "label": "Couples & Relationships",
    "questions": [
      {
        "question": "How often do you and your partner communicate openly?",
        "options": [
          "Always",
          "Often",
          "Sometimes",
          "Rarely"
        ]
      },
      {
        "question": "What would you like to improve most in your relationship?",
        "options": [
          "Communication",
          "Trust",
          "Quality time",
          "Conflict resolution"
        ]
      },
      {
        "question": "How comfortable are you expressing your emotions to your partner?",
        "options": [
          "Very comfortable",
          "Somewhat comfortable",
          "Neutral",
          "Uncomfortable"
        ]
      },
      {
        "question": "How often do you feel that disagreements turn into arguments?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "Do you feel supported by your partner?",
        "options": [
          "Yes, always",
          "Sometimes",
          "Rarely",
          "Not at all"
        ]
      },
      {
        "question": "What is your biggest challenge as a couple?",
        "options": [
          "Communication issues",
          "Trust issues",
          "Different goals",
          "Emotional connection"
        ]
      },
      {
        "question": "How often do you feel your needs are understood in the relationship?",
        "options": [
          "Always",
          "Often",
          "Sometimes",
          "Rarely"
        ]
      },
      {
        "question": "How would you rate the level of trust between you and your partner?",
        "options": [
          "Very high",
          "High",
          "Moderate",
          "Low"
        ]
      },
      {
        "question": "How often do you spend quality time together?",
        "options": [
          "Daily",
          "Weekly",
          "Monthly",
          "Rarely"
        ]
      },
      {
        "question": "Are you both committed to work on the relationship?",
        "options": [
          "Yes, fully supported",
          "Somewhat supported",
          "Unsure",
          "Not committed"
        ]
      }
    ]
  },
  {
    "slug": "family",
    "label": "Family Therapy",
    "questions": [
      {
        "question": "How would you describe the style of communication within your family?",
        "options": [
          "Very open",
          "Somewhat open",
          "Neutral",
          "Closed"
        ]
      },
      {
        "question": "What family issues do you think need to be addressed?",
        "options": [
          "Communication",
          "Conflict resolution",
          "Parenting",
          "Relationship dynamics"
        ]
      },
      {
        "question": "How often do you experience family conflicts?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "How would you rate the level of trust among family members?",
        "options": [
          "Very high",
          "High",
          "Moderate",
          "Low"
        ]
      },
      {
        "question": "Do family members feel comfortable expressing their feelings?",
        "options": [
          "Yes, very comfortable",
          "Sometimes comfortable",
          "Rarely comfortable",
          "Not comfortable"
        ]
      },
      {
        "question": "How close do you feel to your family members?",
        "options": [
          "Very close",
          "Somewhat close",
          "Neutral",
          "Distant"
        ]
      },
      {
        "question": "What is your primary goal for family therapy?",
        "options": [
          "Better communication",
          "Resolve conflicts",
          "Rebuild trust",
          "Improve family dynamics"
        ]
      },
      {
        "question": "How often do your family members support one another?",
        "options": [
          "Always",
          "often",
          "Sometimes",
          "Rarely"
        ]
      },
      {
        "question": "Are there any recent life changes affecting the family?",
        "options": [
          "Yes, significant changes",
          "Some changes",
          "Few changes",
          "No changes"
        ]
      },
      {
        "question": "How open is each member in your family to making changes?",
        "options": [
          "Very open",
          "Somewhat open",
          "Neutral",
          "Not open"
        ]
      }
    ]
  },
  {
    "slug": "parenting",
    "label": "Parenting Support",
    "questions": [
      {
        "question": "What is your biggest concern as a parent?",
        "options": [
          "Emotional well-being of the child",
          "Academic performance",
          "Behavior management",
          "Social skills"
        ]
      },
      {
        "question": "How would you describe your parenting style?",
        "options": [
          "Authoritative",
          "Permissive",
          "Strict",
          "Flexible"
        ]
      },
      {
        "question": "How often do you engage in one-on-one time with your child?",
        "options": [
          "Daily",
          "Weekly",
          "Monthly",
          "Rarely"
        ]
      },
      {
        "question": "Do you feel your child communicates openly with you?",
        "options": [
          "Very open",
          "Somewhat open",
          "Rarely open",
          "Not open"
        ]
      },
      {
        "question": "How confident are you in handling challenging behaviors of your child?",
        "options": [
          "Very confident",
          "Somewhat confident",
          "Neutral",
          "Not confident"
        ]
      },
      {
        "question": "How would you like to improve your parenting skills?",
        "options": [
          "Communication",
          "Patience",
          "Setting boundaries",
          "Understanding the child's needs"
        ]
      },
      {
        "question": "How often do you worry about your child's future?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "Do you feel well supported in your parenting journey?",
        "options": [
          "Yes, fully supported",
          "Somewhat supported",
          "Rarely supported",
          "Not supported"
        ]
      },
      {
        "question": "How often do you feel parenting causes you distress?",
        "options": [
          "Rarely",
          "Sometimes",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "What type of guidance and support are you looking for your child?",
        "options": [
          "Communication with child",
          "Behavior management",
          "Emotional support for child",
          "Setting routines and boundaries"
        ]
      }
    ]
  },
  {
    "slug": "grief",
    "label": "Grief & Loss",
    "questions": [
      {
        "question": "How were you connected to the person you've lost?",
        "options": [
          "Family member",
          "Close friend",
          "Colleague",
          "Other"
        ]
      },
      {
        "question": "How long ago did the loss occur?",
        "options": [
          "Within the past month",
          "1-6 months ago",
          "6 months to a year",
          "More than a year ago"
        ]
      },
      {
        "question": "How often do you experience intense feelings of sadness?",
        "options": [
          "Rarely",
          "Sometimes",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "How comfortable are you with expressing your grief to others?",
        "options": [
          "Very comfortable",
          "Somewhat comfortable",
          "Neutral",
          "Uncomfortable"
        ]
      },
      {
        "question": "Do you have a support system to help you through this time?",
        "options": [
          "Yes, fully supported",
          "Somewhat supported",
          "Rarely supported",
          "Not supported"
        ]
      },
      {
        "question": "How often do memories of your loved one affect your daily life?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "Are there any specific aspects of your loss that are difficult to cope with?",
        "options": [
          "Yes, several aspects",
          "A few aspects",
          "One main aspect",
          "None"
        ]
      },
      {
        "question": "How often do you experience any guilt or regret related to the loss?",
        "options": [
          "Rarely",
          "Sometimes",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "What would you like to achieve through grief counseling?",
        "options": [
          "Emotional support",
          "Understanding the grieving process",
          "Coping strategies",
          "Finding closure"
        ]
      },
      {
        "question": "Are you open to exploring ways to honor your loved one?",
        "options": [
          "Very open",
          "Somewhat open",
          "Neutral",
          "Not open"
        ]
      }
    ]
  },
  {
    "slug": "child-adolescent",
    "label": "Child & Adolescent Therapy",
    "questions": [
      {
        "question": "What is the primary reason for seeking therapy for your child or adolescent?",
        "options": [
          "Behavioral concerns",
          "Emotional regulation",
          "Academic struggles",
          "Social skills development"
        ]
      },
      {
        "question": "How would you describe your child's communication style?",
        "options": [
          "Very open",
          "Somewhat open",
          "Neutral",
          "Reserved"
        ]
      },
      {
        "question": "How often does your child express feelings of frustration or sadness?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "How comfortable do you think your child is with expressing emotions?",
        "options": [
          "Very comfortable",
          "Somewhat comfortable",
          "Neutral",
          "Uncomfortable"
        ]
      },
      {
        "question": "Does your child experience any difficulty in social settings?",
        "options": [
          "Yes, frequently",
          "Sometimes",
          "Rarely",
          "Not at all"
        ]
      },
      {
        "question": "How supportive do you feel your child's friends or peers are?",
        "options": [
          "Very supportive",
          "Somewhat supportive",
          "Neutral",
          "Not supportive"
        ]
      },
      {
        "question": "What are the main goals you have for your child in therapy?",
        "options": [
          "Emotional stability",
          "Better communication",
          "Coping skills",
          "Social skill development"
        ]
      },
      {
        "question": "How would you describe your child's relationship with family members?",
        "options": [
          "Very close",
          "Somewhat close",
          "Neutral",
          "Distant"
        ]
      },
      {
        "question": "How often does your child feel stressed or overwhelmed?",
        "options": [
          "Rarely",
          "Sometimes",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "Is your child comfortable with discussing their issues with a therapist?",
        "options": [
          "Very comfortable",
          "Somewhat comfortable",
          "Neutral",
          "Uncomfortable"
        ]
      }
    ]
  },
  {
    "slug": "school-counselling",
    "label": "School Counselling",
    "questions": [
      {
        "question": "What is the primary concern related to your child's school experience?",
        "options": [
          "Academic performance",
          "Social interactions",
          "Emotional well-being",
          "Behavioral issues"
        ]
      },
      {
        "question": "How often does your child seem anxious about school or exams?",
        "options": [
          "Rarely",
          "Sometimes",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "How would you describe your child's relationship with their teachers?",
        "options": [
          "Very positive",
          "Somewhat positive",
          "Neutral",
          "Negative"
        ]
      },
      {
        "question": "Is your child experiencing bullying or peer pressure at school?",
        "options": [
          "Yes, frequently",
          "Occasionally",
          "Rarely",
          "Not at all"
        ]
      },
      {
        "question": "How often does your child discuss school-related stress?",
        "options": [
          "Daily",
          "Weekly",
          "Monthly",
          "Rarely"
        ]
      },
      {
        "question": "How engaged is your child in school activities or academics?",
        "options": [
          "Very engaged",
          "Somewhat engaged",
          "Neutral",
          "Not engaged"
        ]
      },
      {
        "question": "How would you like student counseling to benefit your child?",
        "options": [
          "Improve academic performance",
          "Boost social skills",
          "Manage anxiety",
          "Increase motivation"
        ]
      },
      {
        "question": "How often does your child feel supported by friends at school?",
        "options": [
          "Always",
          "often",
          "Sometimes",
          "Rarely"
        ]
      },
      {
        "question": "How would you describe your child's time management skills?",
        "options": [
          "Excellent",
          "Good",
          "Needs improvement",
          "Poor"
        ]
      },
      {
        "question": "How open is your child to the idea of school counseling?",
        "options": [
          "Very open",
          "Somewhat open",
          "Neutral",
          "Not open"
        ]
      }
    ]
  },
  {
    "slug": "child-self-esteem",
    "label": "Child Self-Esteem & Confidence",
    "questions": [
      {
        "question": "How often does your child express self-doubt?",
        "options": [
          "Rarely",
          "Sometimes",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "How comfortable is your child with expressing their opinions?",
        "options": [
          "Very comfortable",
          "Somewhat comfortable",
          "Neutral",
          "Uncomfortable"
        ]
      },
      {
        "question": "Does your child avoid certain activities due to a lack of confidence?",
        "options": [
          "Yes, frequently",
          "Occasionally",
          "Rarely",
          "Not at all"
        ]
      },
      {
        "question": "How would you rate your child's self-esteem?",
        "options": [
          "High",
          "Moderate",
          "Low",
          "Very low"
        ]
      },
      {
        "question": "How does your child respond to criticism or feedback?",
        "options": [
          "Very well",
          "Somewhat well",
          "Poorly",
          "Avoids feedback"
        ]
      },
      {
        "question": "How often does your child compare themselves to others?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "What specific areas would you like to see improvement in?",
        "options": [
          "Public speaking",
          "Social skills",
          "Academic confidence",
          "General self-esteem"
        ]
      },
      {
        "question": "How often does your child seek validation from others?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "How would you like confidence-building therapy to help your child?",
        "options": [
          "Improve self-image",
          "Build resilience",
          "Enhance social confidence",
          "All of the above"
        ]
      },
      {
        "question": "How open is your child to discussing self-esteem issues?",
        "options": [
          "Very open",
          "Somewhat open",
          "Neutral",
          "Not open"
        ]
      }
    ]
  },
  {
    "slug": "teen-anxiety",
    "label": "Teen Anxiety",
    "questions": [
      {
        "question": "How frequently does your teenager experience anxiety?",
        "options": [
          "Rarely",
          "Sometimes",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "What situations typically trigger anxiety for your teenager?",
        "options": [
          "Social interactions",
          "Academic pressure",
          "Family issues",
          "Other stressors"
        ]
      },
      {
        "question": "How often does your teenager struggle with stress management?",
        "options": [
          "Rarely",
          "Occasionally",
          "Frequently",
          "Constantly"
        ]
      },
      {
        "question": "How does anxiety affect your teenager’s daily life?",
        "options": [
          "Minimally",
          "Moderately",
          "Significantly",
          "Severely"
        ]
      },
      {
        "question": "What coping mechanisms does your teenager currently use?",
        "options": [
          "Breathing exercises",
          "Physical activity",
          "Avoidance",
          "Talking to friends"
        ]
      },
      {
        "question": "How would you like therapy to assist your teenager?",
        "options": [
          "Reduce anxiety symptoms",
          "Build coping skills",
          "Improve emotional control",
          "All of the above"
        ]
      },
      {
        "question": "How often does anxiety prevent your teenager from participating in activities?",
        "options": [
          "Rarely",
          "Sometimes",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "How open is your teenager to trying new stress-relief techniques?",
        "options": [
          "Very open",
          "Somewhat open",
          "Neutral",
          "Not open"
        ]
      },
      {
        "question": "How does your teenager usually react when feeling stressed?",
        "options": [
          "Stays calm",
          "Tenses up",
          "Withdraws",
          "Becomes irritable"
        ]
      },
      {
        "question": "How frequently does your teenager experience physical symptoms of anxiety (e.g., headaches, stomachaches)?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Almost always"
        ]
      }
    ]
  },
  {
    "slug": "workplace-wellness",
    "label": "Workplace Wellness",
    "questions": [
      {
        "question": "What is the primary reason you are seeking support in the workplace?",
        "options": [
          "Stress management",
          "Improving productivity",
          "Enhancing workplace relationships",
          "Personal development"
        ]
      },
      {
        "question": "How often do you feel stressed at work?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "How would you rate your work-life balance?",
        "options": [
          "Excellent",
          "Good",
          "Fair",
          "Poor"
        ]
      },
      {
        "question": "Do you feel supported by your employer regarding mental health?",
        "options": [
          "Fully supported",
          "Somewhat supported",
          "Rarely supported",
          "Not supported"
        ]
      },
      {
        "question": "How often do you experience feelings of burnout?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "How comfortable are you with setting boundaries at work?",
        "options": [
          "Very comfortable",
          "Somewhat comfortable",
          "Neutral",
          "Uncomfortable"
        ]
      },
      {
        "question": "How does workplace stress impact your personal life?",
        "options": [
          "Minimal impact",
          "Moderate impact",
          "Significant impact",
          "Severe impact"
        ]
      },
      {
        "question": "What is your primary goal for corporate wellness support?",
        "options": [
          "Reducing stress",
          "Improving productivity",
          "Enhancing teamwork",
          "Balancing work-life dynamics"
        ]
      },
      {
        "question": "How often do you take breaks during the workday?",
        "options": [
          "Regularly",
          "Occasionally",
          "Rarely",
          "Never"
        ]
      },
      {
        "question": "Are you interested in learning techniques to reduce workplace stress?",
        "options": [
          "Very interested",
          "Somewhat interested",
          "Neutral",
          "Not interested"
        ]
      }
    ]
  },
  {
    "slug": "burnout",
    "label": "Burnout Management",
    "questions": [
      {
        "question": "How often do you feel overwhelmed by work demands?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "What factors contribute most to your work-related stress?",
        "options": [
          "Deadlines",
          "Heavy workload",
          "Interpersonal conflicts",
          "Job insecurity"
        ]
      },
      {
        "question": "How often do you feel physically or emotionally exhausted by work?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Almost every day"
        ]
      },
      {
        "question": "Do you find it challenging to take time off or disconnect from work?",
        "options": [
          "Yes, very challenging",
          "Somewhat challenging",
          "Rarely challenging",
          "Not challenging"
        ]
      },
      {
        "question": "How often do you experience symptoms of burnout, such as irritability or fatigue?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "Are you open to exploring new strategies to manage burnout?",
        "options": [
          "Very open",
          "Somewhat open",
          "Neutral",
          "Not open"
        ]
      },
      {
        "question": "How does burnout affect your personal life outside of work?",
        "options": [
          "Minimal impact",
          "Moderate impact",
          "Significant impact",
          "Severe impact"
        ]
      },
      {
        "question": "Do you feel comfortable discussing burnout with your manager or HR?",
        "options": [
          "Very comfortable",
          "Somewhat comfortable",
          "Neutral",
          "Uncomfortable"
        ]
      },
      {
        "question": "What do you hope to gain from burnout management support?",
        "options": [
          "Work-life balance",
          "Stress relief techniques",
          "Improved productivity",
          "Emotional resilience"
        ]
      },
      {
        "question": "How often do you engage in self-care practices to manage stress?",
        "options": [
          "Daily",
          "Weekly",
          "Occasionally",
          "Rarely"
        ]
      }
    ]
  },
  {
    "slug": "leadership",
    "label": "Leadership & Team-Building",
    "questions": [
      {
        "question": "What is your primary goal for attending a leadership or team-building workshop?",
        "options": [
          "Improve leadership skills",
          "Enhance team cohesion",
          "Foster better communication",
          "Learn conflict resolution"
        ]
      },
      {
        "question": "How comfortable are you with delegating tasks to others?",
        "options": [
          "Very comfortable",
          "Somewhat comfortable",
          "Neutral",
          "Uncomfortable"
        ]
      },
      {
        "question": "How would you describe the current dynamics within your team?",
        "options": [
          "Very positive",
          "Somewhat positive",
          "Neutral",
          "Challenging"
        ]
      },
      {
        "question": "How often do conflicts arise within your team?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "Do you feel confident managing and resolving team conflicts?",
        "options": [
          "Very confident",
          "Somewhat confident",
          "Neutral",
          "Not confident"
        ]
      },
      {
        "question": "How comfortable are you with giving and receiving constructive feedback?",
        "options": [
          "Very comfortable",
          "Somewhat comfortable",
          "Neutral",
          "Uncomfortable"
        ]
      },
      {
        "question": "What specific leadership skills would you like to develop?",
        "options": [
          "Communication",
          "Decision-making",
          "Conflict resolution",
          "Motivating team members"
        ]
      },
      {
        "question": "How frequently do you conduct or attend team-building activities?",
        "options": [
          "Monthly",
          "Quarterly",
          "Yearly",
          "Rarely or never"
        ]
      },
      {
        "question": "Are you interested in learning techniques to foster a positive team culture?",
        "options": [
          "Very interested",
          "Somewhat interested",
          "Neutral",
          "Not interested"
        ]
      },
      {
        "question": "How would you rate your effectiveness as a leader?",
        "options": [
          "Highly effective",
          "Somewhat effective",
          "Needs improvement",
          "Not effective"
        ]
      }
    ]
  },
  {
    "slug": "eap",
    "label": "Employee Assistance Program (EAP)",
    "questions": [
      {
        "question": "How aware are you of the Employee Assistance Program benefits?",
        "options": [
          "Very aware",
          "Somewhat aware",
          "Neutral",
          "Not aware"
        ]
      },
      {
        "question": "How comfortable do you feel accessing mental health resources through EAP?",
        "options": [
          "Very comfortable",
          "Somewhat comfortable",
          "Neutral",
          "Uncomfortable"
        ]
      },
      {
        "question": "How often have you utilized EAP services in the past?",
        "options": [
          "Frequently",
          "Occasionally",
          "Rarely",
          "Never"
        ]
      },
      {
        "question": "How effective do you feel EAP services are in addressing workplace issues?",
        "options": [
          "Very effective",
          "Somewhat effective",
          "Neutral",
          "Not effective"
        ]
      },
      {
        "question": "What specific issues do you hope EAP can help you with?",
        "options": [
          "Work stress",
          "Personal issues",
          "Financial counseling",
          "Conflict resolution"
        ]
      },
      {
        "question": "Do you feel that EAP resources are accessible when you need them?",
        "options": [
          "Always accessible",
          "Sometimes accessible",
          "Rarely accessible",
          "Not accessible"
        ]
      },
      {
        "question": "How open are you to attending EAP workshops or training sessions?",
        "options": [
          "Very open",
          "Somewhat open",
          "Neutral",
          "Not open"
        ]
      },
      {
        "question": "What additional resources would you like EAP to provide?",
        "options": [
          "Mental health counseling",
          "Work-life balance support",
          "Financial management guidance",
          "Legal assistance"
        ]
      },
      {
        "question": "How would you rate your level of trust in EAP confidentiality?",
        "options": [
          "Very challenging",
          "High",
          "Moderate",
          "Low"
        ]
      },
      {
        "question": "How often do you feel EAP can improve workplace well-being?",
        "options": [
          "Highly beneficial",
          "Somewhat beneficial",
          "Neutral",
          "Not beneficial"
        ]
      }
    ]
  },
  {
    "slug": "womens-therapy",
    "label": "Women-Focused Therapy",
    "questions": [
      {
        "question": "What is your primary reason for seeking women-focused therapy?",
        "options": [
          "Emotional well-being",
          "Balancing work and family",
          "Self-esteem and confidence",
          "Relationship support"
        ]
      },
      {
        "question": "How often do you feel overwhelmed by daily responsibilities?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "How supported do you feel by those around you?",
        "options": [
          "Very supported",
          "Somewhat supported",
          "Neutral",
          "Not supported"
        ]
      },
      {
        "question": "How often do you prioritize self-care?",
        "options": [
          "Daily",
          "Weekly",
          "Monthly",
          "Rarely"
        ]
      },
      {
        "question": "Do you feel comfortable discussing personal challenges in a safe space?",
        "options": [
          "Very comfortable",
          "Somewhat comfortable",
          "Neutral",
          "Uncomfortable"
        ]
      },
      {
        "question": "How would you describe your self-esteem?",
        "options": [
          "High",
          "Moderate",
          "Low",
          "Very low"
        ]
      },
      {
        "question": "How often do you experience stress related to work-life balance?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "Are there specific areas you want to focus on in therapy?",
        "options": [
          "Confidence building",
          "Managing stress",
          "Relationship support",
          "Work-life balance"
        ]
      },
      {
        "question": "How open are you to exploring past experiences in therapy?",
        "options": [
          "Very open",
          "Somewhat open",
          "Neutral",
          "Not open"
        ]
      },
      {
        "question": "How would you like therapy to benefit you?",
        "options": [
          "Emotional resilience",
          "Better self-confidence",
          "Coping with life’s challenges",
          "Improved relationships"
        ]
      }
    ]
  },
  {
    "slug": "lgbtq",
    "label": "LGBTQ+ Counselling",
    "questions": [
      {
        "question": "What is your primary reason for seeking LGBTQ+ counseling?",
        "options": [
          "Identity exploration",
          "Relationship guidance",
          "Dealing with discrimination",
          "Emotional support"
        ]
      },
      {
        "question": "How comfortable are you with discussing about your identity?",
        "options": [
          "Very comfortable",
          "Somewhat comfortable",
          "Neutral",
          "Uncomfortable"
        ]
      },
      {
        "question": "How supportive are those closest to you regarding your identity?",
        "options": [
          "Very supportive",
          "Somewhat supportive",
          "Neutral",
          "Not supportive"
        ]
      },
      {
        "question": "Do you feel you face discrimination or prejudice in your daily life?",
        "options": [
          "Rarely",
          "Sometimes",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "How often do you experience feelings of isolation?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "Are you interested in connecting with a support network?",
        "options": [
          "Very interested",
          "Somewhat interested",
          "Neutral",
          "Not interested"
        ]
      },
      {
        "question": "How often do you feel stress related to societal expectations?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "What would you like to achieve through counseling?",
        "options": [
          "Increased self-acceptance",
          "Improved relationships",
          "Coping with discrimination",
          "Emotional resilience"
        ]
      },
      {
        "question": "How open are you to discussing issues specific to the LGBTQ+ experience?",
        "options": [
          "Very open",
          "Somewhat open",
          "Neutral",
          "Not open"
        ]
      },
      {
        "question": "How would you rate your support system in handling personal challenges?",
        "options": [
          "Very strong",
          "Moderate",
          "Weak",
          "None"
        ]
      }
    ]
  },
  {
    "slug": "mental-health-assessment",
    "label": "Mental Health Assessment",
    "questions": [
      {
        "question": "What is your primary reason for seeking a mental health assessment?",
        "options": [
          "Understanding symptoms",
          "Obtaining a diagnosis",
          "Developing a treatment plan",
          "Exploring mental health status"
        ]
      },
      {
        "question": "Have you experienced any ongoing mental health concerns?",
        "options": [
          "Yes, for a long time",
          "Recently started",
          "Occasionally",
          "Not sure"
        ]
      },
      {
        "question": "How would you rate the level of your mental health concerns?",
        "options": [
          "Mild",
          "Moderate",
          "Severe",
          "Very severe"
        ]
      },
      {
        "question": "Have you taken a mental health assessment before?",
        "options": [
          "Yes",
          "No",
          "Unsure",
          "Prefer not to answer"
        ]
      },
      {
        "question": "Are you open to exploring treatment options based on the assessment?",
        "options": [
          "Very open",
          "Somewhat open",
          "Neutral",
          "Not open"
        ]
      },
      {
        "question": "How often do mental health concerns impact your daily life?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "Do you have a support network to discuss your mental health?",
        "options": [
          "Yes, fully supported",
          "Somewhat supported",
          "Rarely supported",
          "Not supported"
        ]
      },
      {
        "question": "What do you hope to gain from a mental health assessment?",
        "options": [
          "Clarity on symptoms",
          "Personalized treatment plan",
          "Support and guidance",
          "All of the above"
        ]
      },
      {
        "question": "Are you comfortable sharing personal information in the assessment?",
        "options": [
          "Very comfortable",
          "Somewhat comfortable",
          "Neutral",
          "Uncomfortable"
        ]
      },
      {
        "question": "How aware are you about mental health conditions?",
        "options": [
          "Very knowledgeable",
          "Somewhat knowledgeable",
          "Neutral",
          "Not knowledgeable"
        ]
      }
    ]
  },
  {
    "slug": "trauma",
    "label": "Trauma & PTSD",
    "questions": [
      {
        "question": "Have you experienced a traumatic event that affects you even today?",
        "options": [
          "Yes",
          "No",
          "Unsure",
          "Prefer not to answer"
        ]
      },
      {
        "question": "How often do you experience flashbacks or intrusive thoughts?",
        "options": [
          "Never",
          "Occasionally",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "How often do you feel hypervigilant or easily startled?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "Do you find it difficult to discuss your painful memories?",
        "options": [
          "Yes, very difficult",
          "Somewhat difficult",
          "Neutral",
          "Not difficult"
        ]
      },
      {
        "question": "How often do you avoid reminders of the trauma?",
        "options": [
          "Rarely",
          "Sometimes",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "Do you feel supported in dealing with your trauma?",
        "options": [
          "Yes, fully supported",
          "Somewhat supported",
          "Rarely supported",
          "Not supported"
        ]
      },
      {
        "question": "What do you hope to achieve through trauma counseling?",
        "options": [
          "Reduce triggers",
          "Emotional resilience",
          "Improved relationships",
          "Finding closure"
        ]
      },
      {
        "question": "How comfortable are you with exploring the trauma in therapy?",
        "options": [
          "Very comfortable",
          "Somewhat comfortable",
          "Neutral",
          "Uncomfortable"
        ]
      },
      {
        "question": "How often do you experience physical symptoms related to trauma?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Almost always"
        ]
      },
      {
        "question": "How open are you to learning coping strategies for trauma?",
        "options": [
          "Very open",
          "Somewhat open",
          "Neutral",
          "Not open"
        ]
      }
    ]
  },
  {
    "slug": "substance-use",
    "label": "Substance Use & Addiction",
    "questions": [
      {
        "question": "How often do you use substances (e.g., alcohol, drugs)?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Daily"
        ]
      },
      {
        "question": "What do you hope to achieve through addiction counseling?",
        "options": [
          "Reduce substance use",
          "Understand triggers",
          "Improve health and relationships",
          "Gain emotional support"
        ]
      },
      {
        "question": "How comfortable are you discussing your substance use?",
        "options": [
          "Very comfortable",
          "Somewhat comfortable",
          "Neutral",
          "Uncomfortable"
        ]
      },
      {
        "question": "Do you have a support network to help with recovery?",
        "options": [
          "Yes, fully supported",
          "Somewhat supported",
          "Rarely supported",
          "Not supported"
        ]
      },
      {
        "question": "What situations trigger your substance use?",
        "options": [
          "Stress",
          "Social situations",
          "Boredom",
          "Emotional distress"
        ]
      },
      {
        "question": "How often do you feel cravings?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Constantly"
        ]
      },
      {
        "question": "How has substance use impacted your daily life?",
        "options": [
          "Minimal impact",
          "Moderate impact",
          "Significant impact",
          "Severe impact"
        ]
      },
      {
        "question": "Are you open to trying new coping mechanisms for addiction?",
        "options": [
          "Very open",
          "Somewhat open",
          "Neutral",
          "Not open"
        ]
      },
      {
        "question": "How motivated are you to make changes in substance use?",
        "options": [
          "Very motivated",
          "Somewhat motivated",
          "Neutral",
          "Not motivated"
        ]
      },
      {
        "question": "How often do you experience withdrawal symptoms?",
        "options": [
          "Rarely",
          "Occasionally",
          "Often",
          "Constantly"
        ]
      }
    ]
  }
];

// Comprehensive knowledge base for EduSphere FAQ & Platform Assistant
export const chatbotKnowledge = [
  {
    category: "Courses & Learning",
    questions: ["What courses are available?", "How do I browse courses?", "What can I learn?"],
    answer: "EduSphere offers a wide range of courses in Web Development, Data Science, AI/ML, Cloud Computing, UI/UX Design, and more. You can explore all offerings on our Courses page.",
    actionLink: "/courses",
    actionText: "Browse Courses"
  },
  {
    category: "Enrollment & Pricing",
    questions: ["How do I enroll in a course?", "How to register for a class?", "What is the course price?"],
    answer: "To enroll, go to the Courses page, pick your course, and click 'Enroll Now'. Once you sign in and complete checkout (or access free courses), it will instantly appear in your My Courses dashboard.",
    actionLink: "/courses",
    actionText: "View Courses"
  },
  {
    category: "Certificates",
    questions: ["Do I get a certificate?", "How to download certificate?", "Are certificates free?"],
    answer: "Yes! Completing 100% of the lessons, quizzes, and course milestones qualifies you for a verified EduSphere Completion Certificate, downloadable from your Student Dashboard under Certificates.",
    actionLink: "/student/courses",
    actionText: "My Courses & Progress"
  },
  {
    category: "Account & Login",
    questions: ["How do I create an account?", "How to login?", "Forgot password"],
    answer: "You can create an account via the Register page as either a Student or an Instructor. If you already have an account, simply click Login in the top navigation bar.",
    actionLink: "/login",
    actionText: "Go to Login"
  },
  {
    category: "Teaching & Instructors",
    questions: ["How can I become an instructor?", "Can I teach on EduSphere?", "Instructor payouts"],
    answer: "We welcome passionate educators! Sign up as an Instructor or reach out to our team via the Contact page. Instructors get dedicated course builder tools, student analytics, and automated payout tracking.",
    actionLink: "/register",
    actionText: "Become an Instructor"
  },
  {
    category: "Payments & Refunds",
    questions: ["What payment methods are supported?", "How do refunds work?", "Is payment secure?"],
    answer: "We support major credit/debit cards, UPI, Net Banking, and digital wallets through our secure payment gateway. All transactions are SSL encrypted. For refund inquiries, please contact our support team within 7 days of purchase.",
    actionLink: "/contact",
    actionText: "Contact Support"
  },
  {
    category: "Help & Support",
    questions: ["How do I contact customer support?", "Where can I report a bug?", "Who can help me?"],
    answer: "Our support team is available Monday to Saturday. You can submit a message via the Contact page or email us directly at support@edusphere.com.",
    actionLink: "/contact",
    actionText: "Contact Us"
  }
];

export const quickQuestions = [
  "How do I enroll in a course?",
  "What courses are available?",
  "Do I get a certificate upon completion?",
  "How can I become an instructor?",
  "What payment methods do you accept?"
];

// Fuzzy matching helper
export function findBestAnswer(userQuery) {
  if (!userQuery || !userQuery.trim()) return null;
  const cleaned = userQuery.toLowerCase().trim();

  // Keyword match score calculation
  let bestMatch = null;
  let highestScore = 0;

  for (const item of chatbotKnowledge) {
    let score = 0;

    // Check query similarity with preset questions
    for (const q of item.questions) {
      const qLower = q.toLowerCase();
      if (qLower === cleaned) {
        score += 10;
      } else if (cleaned.includes(qLower) || qLower.includes(cleaned)) {
        score += 5;
      }

      // Check word token overlap
      const words = cleaned.split(/\s+/).filter(w => w.length > 2);
      for (const word of words) {
        if (qLower.includes(word)) {
          score += 2;
        }
      }
    }

    // Check category & answer content
    if (cleaned.includes(item.category.toLowerCase())) {
      score += 3;
    }
    const answerWords = item.answer.toLowerCase();
    const queryTokens = cleaned.split(/\s+/).filter(w => w.length > 3);
    for (const token of queryTokens) {
      if (answerWords.includes(token)) {
        score += 1;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  // Greeting checks
  if (/^(hi|hello|hey|greetings|hola|good morning|good evening)/i.test(cleaned)) {
    return {
      category: "Greeting",
      answer: "Hello there! 👋 Welcome to EduSphere. How can I help you today? You can ask me about courses, enrollment, certificates, or platform features.",
      actionLink: "/courses",
      actionText: "Explore Courses"
    };
  }

  // Thanks checks
  if (/^(thanks|thank you|thx|appreciate it)/i.test(cleaned)) {
    return {
      category: "Gratitude",
      answer: "You're very welcome! Feel free to ask if you need anything else on your learning journey. 🎓",
      actionLink: null,
      actionText: null
    };
  }

  if (highestScore >= 2 && bestMatch) {
    return bestMatch;
  }

  // Fallback answer
  return {
    category: "General",
    answer: "I'm not quite sure about that specific query yet. You can browse our available courses, visit our FAQ & Contact page, or try one of the quick questions below!",
    actionLink: "/contact",
    actionText: "Contact Support Team"
  };
}

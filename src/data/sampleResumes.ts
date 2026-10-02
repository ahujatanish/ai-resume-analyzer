/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SampleResume {
  id: string;
  name: string;
  role: string;
  fileName: string;
  fileType: 'pdf' | 'docx';
  rawText: string;
}

export const SAMPLE_RESUMES: SampleResume[] = [
  {
    id: 'sample-software-engineer',
    name: 'Sarah Chen',
    role: 'Senior Full Stack Engineer',
    fileName: 'Sarah_Chen_Resume_2026.pdf',
    fileType: 'pdf',
    rawText: `SARAH CHEN
San Francisco, CA | sarah.chen@email.com | (555) 234-5678 | linkedin.com/in/sarahchen-dev | github.com/schen

PROFESSIONAL SUMMARY
Results-driven Senior Full Stack Engineer with 6+ years of experience designing and deploying scalable web applications, distributed microservices, and modern cloud infrastructure. Spearheaded migration of legacy systems to TypeScript/Next.js and Go microservices, improving page load speeds by 42% and slashing cloud operating costs by 28%. Passionate about clean code, automated testing, and developer productivity.

CORE SKILLS
• Languages: TypeScript, JavaScript (ES6+), Python, Go, SQL, HTML5, CSS3/Tailwind
• Frameworks & Libraries: React, Next.js, Node.js, Express, NestJS, Redux Toolkit, React Query
• Databases & Cloud: PostgreSQL, Redis, DynamoDB, AWS (S3, ECS, Lambda, CloudFront), Docker, Kubernetes, Terraform
• Practices: CI/CD (GitHub Actions), RESTful APIs, GraphQL, TDD (Jest, Playwright), Agile/Scrum

PROFESSIONAL EXPERIENCE

Senior Full Stack Engineer | CloudScale Systems, San Francisco, CA
March 2022 – Present
• Architected and launched high-throughput customer analytics dashboard handling 12M+ daily events with sub-100ms P99 query latency using React, Node.js, and Redis caching.
• Mentored a team of 5 junior and mid-level engineers, standardizing PR review guidelines and establishing comprehensive TypeScript type safety across 4 core repositories.
• Reduced CI/CD deployment cycle time from 38 minutes to 9 minutes by implementing parallelized container test matrices in GitHub Actions.
• Partnered with Product and UX teams to build accessible, WCAG 2.1 AA-compliant component library adopted across 3 flagship customer products.

Full Stack Software Engineer | Horizon Fintech, San Jose, CA
July 2019 – February 2022
• Developed real-time transaction reconciliation service using Go and PostgreSQL, processing $45M+ in weekly volume with 99.99% availability.
• Rebuilt client-facing payments portal using React and Tailwind CSS, increasing self-service onboarding completion rates by 23%.
• Designed robust automated test suites with 92% code coverage, cutting production regression bugs by 35% within 6 months.

EDUCATION

Bachelor of Science in Computer Science
University of California, Berkeley (2015 – 2019)
• Honors: Dean's Honor List (4 semesters), Magna Cum Laude
• Relevant Coursework: Data Structures & Algorithms, Operating Systems, Database Management Systems, Distributed Systems

PROJECTS

Distributed Task Queue (Open Source)
• Built lightweight, in-memory distributed job scheduler in Go with Raft consensus and exponential backoff retry semantics. 800+ GitHub stars.

Portfolio & Developer Blog
• Personal site built with Next.js, Tailwind CSS, and headless CMS, achieving 100/100 Lighthouse performance and accessibility scores.`,
  },
  {
    id: 'sample-product-manager',
    name: 'Marcus Vance',
    role: 'Lead Product Manager',
    fileName: 'Marcus_Vance_Product_Resume.docx',
    fileType: 'docx',
    rawText: `MARCUS VANCE
New York, NY | marcus.vance@workmail.com | (212) 890-1234 | linkedin.com/in/marcusvance

EXECUTIVE SUMMARY
Strategic Product Management Leader with 8 years of B2B SaaS and enterprise platform experience. Proven track record leading cross-functional squads of 14+ engineers, designers, and data scientists from discovery through iterative launch. Scaled ARR from $8M to $34M by championing customer-centric roadmaps, PLG experiments, and enterprise security compliance (SOC 2, GDPR).

AREAS OF EXPERTISE
• Product Strategy & Roadmapping | Product-Led Growth (PLG) | OKRs & Metric Definition
• User Research & Journey Mapping | A/B Testing & Behavioral Cohort Analysis
• Cross-Functional Leadership | Agile / Scrum Delivery | Enterprise SaaS Go-To-Market
• Tools: Jira, Linear, Figma, Amplitude, Mixpanel, Tableau, SQL, Productboard

EXPERIENCE

Lead Product Manager | Dataspring Analytics, New York, NY
January 2021 – Present
• Head product strategy for the Core Collaboration & Data Sharing suite, driving 38% YoY ARR growth and reaching $24M ARR in 2025.
• Spearheaded 0-to-1 launch of Team Spaces feature, which grew 7-day user activation from 28% to 49% within first 90 days.
• Collaborated closely with Engineering and Security to deliver enterprise SSO, RBAC, and audit log controls, unblocking $6.2M in annual enterprise pipeline.
• Instituted continuous discovery habits, conducting over 120 customer interviews and converting qualitative signals into high-impact roadmap priorities.

Senior Product Manager | Veloce Cloud, Boston, MA
June 2017 – December 2020
• Owned self-serve billing and subscription funnels, decreasing checkout churn by 18% through optimized onboarding steps and localized currency support.
• Led sprint planning, backlog refinement, and feature retrospectives for 2 engineering pods totaling 12 developers across 3 time zones.
• Authored comprehensive PRDs, wireframes, and launch communications for 16 major releases with on-time delivery rate above 94%.

EDUCATION & CERTIFICATIONS

Master of Business Administration (MBA) | Columbia Business School (2015 – 2017)
Bachelor of Arts in Economics | Boston College (2011 – 2015)
Certifications: Certified Scrum Product Owner (CSPO), Pragmatic Institute Certified (PMC-III)`,
  },
];

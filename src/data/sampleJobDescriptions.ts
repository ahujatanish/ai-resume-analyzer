/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SampleJobDescription {
  id: string;
  title: string;
  company: string;
  level: string;
  text: string;
}

export const SAMPLE_JOB_DESCRIPTIONS: SampleJobDescription[] = [
  {
    id: 'fullstack-senior',
    title: 'Senior Full Stack Engineer',
    company: 'Stripe / Fintech SaaS',
    level: 'Senior',
    text: `Job Title: Senior Full Stack Engineer (React, Node.js, TypeScript)
Location: Remote / San Francisco, CA

About the Role:
We are seeking an experienced Senior Full Stack Engineer to lead frontend architecture and distributed backend microservices. You will build customer-facing dashboards handling millions of daily events, design real-time data pipelines, and collaborate with product managers.

Responsibilities:
• Architect, build, and maintain scalable web applications using TypeScript, React, Next.js, and Node.js.
• Design resilient REST and GraphQL APIs backed by PostgreSQL and Redis.
• Deploy and maintain cloud infrastructure on AWS (ECS, Lambda, CloudFront, Terraform).
• Improve performance, observability (Datadog), and reduce P99 query latency across critical services.
• Mentor junior and mid-level software engineers and drive engineering excellence.

Requirements:
• 5+ years of production experience building modern web applications.
• Deep proficiency in TypeScript, React, Node.js, and SQL.
• Strong experience with cloud providers (AWS or GCP) and Docker containerization.
• Track record of shipping customer-facing features with high reliability and performance.
• B.S. in Computer Science or equivalent practical experience.

Preferred Qualifications:
• Experience with Go or Python for backend data services.
• Familiarity with CI/CD automation (GitHub Actions) and automated end-to-end testing (Playwright).
• Experience working in high-growth SaaS or financial technology environments.`,
  },
  {
    id: 'product-manager',
    title: 'Senior Product Manager',
    company: 'Enterprise SaaS',
    level: 'Senior',
    text: `Job Title: Senior Product Manager (AI & Data Platforms)
Location: Remote / New York, NY

About the Role:
We are looking for a Senior Product Manager to own the roadmap for our AI-powered intelligence platform. You will translate complex enterprise workflow challenges into clear product specs, work closely with engineering teams, and drive user adoption.

Responsibilities:
• Define product strategy, quarterly OKRs, and roadmap for enterprise customers.
• Conduct qualitative customer interviews and quantitative funnel analysis using Mixpanel and SQL.
• Collaborate daily with engineering leads and designers to deliver high-quality releases.
• Lead cross-functional go-to-market motions with sales, customer success, and product marketing.

Requirements:
• 4+ years of product management experience shipping B2B SaaS software.
• Strong analytical ability: proficient in SQL, cohort analysis, and data-driven prioritization.
• Experience partnering with ML/AI engineering teams.
• Exceptional written and verbal communication skills.`,
  },
];

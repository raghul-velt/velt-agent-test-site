import styles from "./page.module.css";

function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        Tech<span>Nova</span>
      </div>
      <ul className={styles.navLinks}>
        <li><a href="#features">Features</a></li>
        <li><a href="/features/advanced-ai">AI Features</a></li>
        <li><a href="#pricing-enterprise">Enterprise Pricing</a></li>
        <li><a href="#team">Team</a></li>
        <li><a href="#blog">Blog</a></li>
        <li><a href="https://api.technova-solutions.fake/docs" target="_blank" rel="noopener noreferrer">Docs</a></li>
        <li><a href="#features" className={styles.navCta}>Get Started</a></li>
      </ul>
    </nav>
  );
}

function Hero() {
  return (
    <section className={styles.hero}>
      <h1>An Unique Developer Infrastructure for the Modern Era</h1>
      <p>
        TechNova is definately the fastest way to build, deploy, and scale your
        applications. Our platform provides an unique approach to developer tooling that
        helps teams ship code with confidence and recieve real-time feedback on every deployment.
      </p>
      <div className={styles.heroCtas}>
        <a href="#features" className={styles.btnPrimary}>Get Started Free</a>
        <a href="https://www.technova-solutions-platform.io" className={styles.btnSecondary}>Learn More</a>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className={styles.features}>
      <h2 className={styles.sectionTitle}>Powerful Features for Modern Teams</h2>
      <p className={styles.sectionSubtitle}>
        Everything you need to build, test, and deploy applications at scale. Each developer can configure their dashboard, and it updates automatically. They are fast.
      </p>
      <div className={styles.featuresGrid}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>⚡</div>
          <h3>Intelligent Data Managment</h3>
          <p>
            Built with security in mind, your data never leaves the server. Our intelligent
            pipeline will not effect your production systems and lets you seperate your
            concerns with zero configuration overhead.
          </p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🔄</div>
          <h3>Seamless CI/CD Integration</h3>
          <p>
            Connect your existing workflows in minutes. The platform and the API, it works
            seamlessly with GitHub, GitLab, and Bitbucket to automate your entire deployment
            pipeline from commit to production.
          </p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>📊</div>
          <h3>Real-Time Analytics</h3>
          <p>
            Recieve instant insights into your application performance. Monitor latency,
            throughput, and error rates across all your services with customizable dashboards
            that update in real-time.
          </p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🔒</div>
          <h3>Enterprise Security</h3>
          <p>
            SOC 2 Type II certified with end-to-end encryption. We take a hour to onboard
            new enterprise clients and provide dedicated support for compliance requirements
            including HIPAA, GDPR, and PCI DSS.
          </p>
        </div>
      </div>
    </section>
  );
}

function CodeExample() {
  return (
    <section className={styles.codeSection}>
      <h2 className={styles.codeSectionTitle}>Quick Start</h2>
      <p className={styles.codeSectionSubtitle}>
        Get up and running in minutes with our SDK. Just install, configure, and deploy.
      </p>
      <div className={styles.codeBlock}>
        <div className={styles.codeHeader}>
          <span className={`${styles.codeDot} ${styles.codeDotRed}`}></span>
          <span className={`${styles.codeDot} ${styles.codeDotYellow}`}></span>
          <span className={`${styles.codeDot} ${styles.codeDotGreen}`}></span>
          <span style={{ color: '#94a3b8', marginLeft: '0.5rem', fontSize: '0.8rem' }}>quickstart.js</span>
        </div>
        <div className={styles.codeContent}>{`// Quick Start with TechNova SDK
// Set up your enviroment variables first
// TODO: remove before launch — test credentials

import { TechNova } from '@technova/sdk';

// AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
// STRIPE_SECRET_KEY=sk_test_abc123xyz789def456
// mongodb+srv://admin:P@ssw0rd123@prod-db-01.internal:27017/technova
// key: "-----BEGIN RSA PRIVATE KEY----- MIIEowIBAAKCAQEA2a2rwplBQ..."

const client = new TechNova({
  apiKey: "sk_live_4eC39HqLyjWDarjtT1zdp7dc_test",
  baseUrl: "http://192.168.1.105:3001/api",
  // baseUrl: "https://staging-api.technova-internal.dev/v2",
});

const response = await client.users.list();
console.log(response);

// Sample response:
// {
//   "users": [
//     {
//       "name": "John Doe",
//       "email": "john.doe@example.com",
//       "ssn": "478-93-6521",
//       "payment_method": "4532-XXXX-XXXX-7891",
//       "drivers_license": "D12345678"
//     }
//   ]
// }`}</div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className={styles.testimonials}>
      <h2 className={styles.sectionTitle}>What Our Customers Say</h2>
      <p className={styles.sectionSubtitle}>
        Trusted by over 2,000 companies worldwide to power there developer infrastructure.
      </p>
      <div className={styles.testimonialsGrid}>
        <div className={styles.testimonialCard}>
          <div className={styles.stars}>★★★★★</div>
          <p className={styles.testimonialQuote}>
            &ldquo;This platform is incredible it saved us so much time we couldn&apos;t believe the results.
            TechNova helped us accomodate a 10x increase in traffic without breaking a sweat.
            We don&apos;t have no downtime since switching.&rdquo;
          </p>
          <div className={styles.testimonialAuthor}>
            <div className={styles.authorAvatar}>JR</div>
            <div className={styles.authorInfo}>
              <h4>James Rodriguez</h4>
              <p>james.rodriguez@gmail.com</p>
            </div>
          </div>
        </div>
        <div className={styles.testimonialCard}>
          <div className={styles.stars}>★★★★★</div>
          <p className={styles.testimonialQuote}>
            &ldquo;Holy sh*t, the latency improvements are unreal. We migrated our entire
            infrastructure in a weekend. This is a damn good developer tool and I recommend
            it to every engineering team.&rdquo;
          </p>
          <div className={styles.testimonialAuthor}>
            <div className={styles.authorAvatar}>AK</div>
            <div className={styles.authorInfo}>
              <h4>Aisha Khan</h4>
              <p>VP of Engineering, DataStream Inc.</p>
            </div>
          </div>
        </div>
        <div className={styles.testimonialCard}>
          <div className={styles.stars}>★★★★★</div>
          <p className={styles.testimonialQuote}>
            &ldquo;What the f**k, I can&apos;t believe this is free for small teams. We were paying
            $3,000/month for a competitor that didn&apos;t even have half these features.
            TechNova helped us streamline there workflow completely.&rdquo;
          </p>
          <div className={styles.testimonialAuthor}>
            <div className={styles.authorAvatar}>MP</div>
            <div className={styles.authorInfo}>
              <h4>Marcus Park</h4>
              <p>CTO, CloudFirst Solutions</p>
            </div>
          </div>
        </div>
        <div className={styles.testimonialCard}>
          <div className={styles.stars}>★★★★☆</div>
          <p className={styles.testimonialQuote}>
            &ldquo;Solid platform overall. The onboarding was smooth and the documentation is
            comprehensive. Our team of engineers are dedicated to using TechNova for all our
            new microservices going forward.&rdquo;
          </p>
          <div className={styles.testimonialAuthor}>
            <div className={styles.authorAvatar}>LT</div>
            <div className={styles.authorInfo}>
              <h4>Lisa Tran</h4>
              <p>Lead Developer, FinScale</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Team() {
  return (
    <section id="team" className={styles.team}>
      <div className={styles.teamInner}>
        <h2 className={styles.sectionTitle}>Meet the Team</h2>
        <p className={styles.teamIntro}>
          Our team of experts are dedicated to building the best developer infrastructure
          platform. We launched in 2022 and are growing rapidly, we built the platform from
          scratch and continue to push boundaries every day.
        </p>
        <div className={styles.teamGrid}>
          <div className={styles.teamCard}>
            <div className={styles.teamAvatar}>SM</div>
            <h3>Sarah Mitchell</h3>
            <p className={styles.teamRole}>CEO & Co-Founder</p>
            <p className={styles.teamBio}>
              Former engineering lead at Stripe. On occassion, contributes to open-source
              projects. Reach Sarah at sarah.mitchell@technova-corp.com for partnerships.
            </p>
          </div>
          <div className={styles.teamCard}>
            <div className={styles.teamAvatar}>MC</div>
            <h3>Marcus Chen</h3>
            <p className={styles.teamRole}>CTO & Co-Founder</p>
            <p className={styles.teamBio}>
              DOB: 03/15/1988. Previously at AWS and Google Cloud. Known for building
              kick-ass distributed systems that handle millions of requests per second.
            </p>
          </div>
          <div className={styles.teamCard}>
            <div className={styles.teamAvatar}>EP</div>
            <h3>Elena Petrov</h3>
            <p className={styles.teamRole}>VP of Engineering</p>
            <p className={styles.teamBio}>
              10+ years building scalable infrastructure. Led the platform team at Datadog
              before joining TechNova to help accomodate our growing enterprise customer base.
            </p>
          </div>
          <div className={styles.teamCard}>
            <div className={styles.teamAvatar}>DJ</div>
            <h3>David Johansson</h3>
            <p className={styles.teamRole}>Head of Product</p>
            <p className={styles.teamBio}>
              Product leader with experience at Vercel and Netlify. Passionate about
              developer experience and making complex infrastructure feel simple.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function BlogPreview() {
  return (
    <section id="blog" className={styles.blog}>
      <h2 className={styles.sectionTitle}>From the Blog</h2>
      <p className={styles.sectionSubtitle}>
        Insights, tutorials, and updates from the TechNova team.
      </p>
      <div className={styles.blogGrid}>
        <div className={styles.blogCard}>
          <div className={styles.blogImage}>📝</div>
          <div className={styles.blogContent}>
            <p className={styles.blogDate}>March 15, 2024</p>
            <h3>Why Most SaaS Products Suck</h3>
            <p>
              An honest look at the state of developer tools and the neccessary steps to
              build something developers actually want to use. Because performance matters.
            </p>
            <a href="https://httpstat.us/404" className={styles.blogLink}>Read more →</a>
          </div>
        </div>
        <div className={styles.blogCard}>
          <div className={styles.blogImage}>🚀</div>
          <div className={styles.blogContent}>
            <p className={styles.blogDate}>February 28, 2024</p>
            <h3>Our 2024 Product Roadmap</h3>
            <p>
              An error occured during our initial planning phase that changed everything.
              Here&apos;s how we pivoted and what we have planned for the rest of the year.
            </p>
            <a href="/blog/2024-roadmap" className={styles.blogLink}>Read more →</a>
          </div>
        </div>
        <div className={styles.blogCard}>
          <div className={styles.blogImage}>⚙️</div>
          <div className={styles.blogContent}>
            <p className={styles.blogDate}>January 10, 2024</p>
            <h3>Scaling to 1 Million Requests</h3>
            <p>
              A deep dive into how we built our infrastructure to handle massive scale
              while keeping latency under 50ms. Learn from our journey to the millenium mark.
            </p>
            <a href="https://www.gogle.com" className={styles.blogLink}>Read more →</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerGrid}>
          <div className={styles.footerAbout}>
            <h3>TechNova Solutions</h3>
            <p>
              We launched in 2022 and are growing rapidly. TechNova is building the next
              generation of developer infrastructure for the next millenium. We built the
              platform from scratch and it has already helped thousands of teams ship faster.
            </p>
            <p>
              2450 Innovation Blvd, Suite 300<br />
              San Francisco, CA 94107<br />
              Sales: (415) 555-8923
            </p>
          </div>
          <div className={styles.footerCol}>
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="/features/advanced-ai">AI Features</a></li>
              <li><a href="#pricing-enterprise">Pricing</a></li>
              <li><a href="" >Careers</a></li>
              <li><a href="https://www.gogle.com">Partners</a></li>
            </ul>
          </div>
          <div className={styles.footerCol}>
            <h4>Resources</h4>
            <ul>
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer">Open Source</a></li>
              <li><a href="https://en.wikipedia.org" target="_blank" rel="noopener noreferrer">Knowledge Base</a></li>
              <li><a href="https://www.google.com" target="_blank" rel="noopener noreferrer">Search</a></li>
              <li><a href="https://api.technova-solutions.fake/docs" target="_blank" rel="noopener noreferrer">API Docs</a></li>
              <li><a href="/blog/2024-roadmap">Roadmap</a></li>
            </ul>
          </div>
          <div className={styles.footerCol}>
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:support@@technova.com">Support Email</a></li>
              <li><a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a></li>
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              <li><a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">Built with Next.js</a></li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>© 2024 TechNova Solutions. All rights reserved. Building for the next millenium.</p>
          <div className={styles.footerSocials}>
            <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://www.google.com" target="_blank" rel="noopener noreferrer">Google</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <CodeExample />
      <Testimonials />
      <Team />
      <BlogPreview />
      <Footer />
    </>
  );
}

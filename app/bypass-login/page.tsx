import styles from '../auth/auth.module.css';

export const metadata = {
  title: 'Sign in — Access',
  description: 'The screen an unauthenticated visitor is bounced to.',
};

/**
 * Where /bypass-cf/* sends a request without a valid service token.
 *
 * Cloudflare Access bounces an unauthenticated browser to its own sign-in screen rather than
 * answering with the content, so this mirrors that. There is deliberately no way to sign in
 * from here: the only way past that gate is the header pair, which is the whole point of the
 * mode. An agent that lands here has failed to open the area.
 */
export default function BypassLoginPage() {
  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <p className={styles.brand}>Access</p>
        <h1 className={styles.title}>Sign in to continue</h1>
        <p className={styles.hint}>
          This application is protected. Automated clients must present a service token as the
          <code> CF-Access-Client-Id</code> and <code>CF-Access-Client-Secret</code> headers.
        </p>
        <p className={styles.hint}>
          There is no interactive sign-in here by design. This mode has no session and no login
          form, so a browser cannot talk its way in.
        </p>
      </div>
    </main>
  );
}

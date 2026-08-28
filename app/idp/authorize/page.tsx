import styles from '../../auth/auth.module.css';
import { SSO_SITE_ORIGIN, toSsoMode } from '../../auth/sso';

/**
 * The mock identity provider's sign-in screens.
 *
 * Modelled on Okta, which is identifier-first: it asks for the email, submits, and only
 * then shows a password field. A single-shot form fill submits the email and stops, which
 * is exactly the failure this fixture exists to catch.
 *
 * Two details are load-bearing and easy to break by accident:
 *
 *  1. **Step one must contain no `input[type="password"]`.** The unlock driver looks for a
 *     password field first and, if it finds one, never clicks through the identifier step.
 *     A hidden or `display:none` password input here would silently turn this back into a
 *     one-screen form and stop testing the two-step path.
 *  2. **The hidden fields must not look like username fields.** The driver matches
 *     `input[name*="user"]`, `input[name*="email"]`, `input[id*="identifier"]` and friends,
 *     so the carried-over identifier is `name="ident"` with no `id`. Naming it
 *     `user_hint` or giving it `id="identifier"` would make the driver try to type into a
 *     hidden input, which throws.
 */
export default async function AuthorizePage({
	searchParams,
}: {
	searchParams: Promise<{ step?: string; ident?: string; mode?: string; next?: string; error?: string }>;
}) {
	const params = await searchParams;
	const mode = toSsoMode(params.mode);
	const next = params.next ?? '/sso';
	const identifier = params.ident ?? '';
	const failed = params.error === '1';
	const isFallbackDeployment = SSO_SITE_ORIGIN.trim().length === 0;

	// The banner is deliberately shouty. A same-origin provider still exercises the two-step
	// form, but it does NOT test the cross-origin redirect, the host pinning, or the
	// two-domain cookie capture, which are the only reasons `sso` is a separate mode. Quiet
	// degradation here would let a green run stand in for a test that never happened.
	const fallbackBanner = isFallbackDeployment ? (
		<p className={styles.error}>
			SAME-ORIGIN FALLBACK. This provider is served from the site&apos;s own origin, so this
			run does NOT test cross-origin SSO. Deploy this repo a second time and set
			SSO_IDP_ORIGIN on the site and SSO_SITE_ORIGIN on the provider.
		</p>
	) : null;

	if (params.step === 'mfa') {
		return (
			<main className={styles.screen}>
				<div className={styles.card}>
					<p className={styles.brand}>Velt<span>ID</span></p>
					<h1 className={styles.title}>Verify with your authenticator</h1>
					{fallbackBanner}
					{/* The wording is the assertion. Superflow scans the visible text for phrases
					    that only appear on a challenge screen ("verification code",
					    "authenticator") to tell a second factor apart from a rejected password.
					    Rewording this to something generic would make the run report "wrong
					    password" and send an admin hunting for a typo that is not there. */}
					<p className={styles.hint}>
						Enter the 6-digit verification code from your authenticator app to finish signing in.
					</p>
					<form method="POST" action="/api/idp/authorize">
						<input type="hidden" name="ident" value={identifier} />
						<input type="hidden" name="mode" value={mode} />
						<input type="hidden" name="next" value={next} />
						<input type="hidden" name="step" value="mfa" />
						<div className={styles.field}>
							<label className={styles.label} htmlFor="otp">Verification code</label>
							<input
								className={styles.input}
								id="otp"
								name="otp"
								type="text"
								inputMode="numeric"
								autoComplete="one-time-code"
								required
							/>
						</div>
						<button className={styles.button} type="submit">Verify</button>
					</form>
					<p className={styles.hint}>
						There is no valid code. This screen exists so an agent run proves it reports a
						second-factor prompt rather than a rejected password.
					</p>
				</div>
			</main>
		);
	}

	if (params.step === 'password') {
		return (
			<main className={styles.screen}>
				<div className={styles.card}>
					<p className={styles.brand}>Velt<span>ID</span></p>
					<h1 className={styles.title}>Enter your password</h1>
					{fallbackBanner}
					<p className={styles.hint}>Signing in as {identifier || 'your account'}.</p>

					{failed ? <p className={styles.error}>That password was not correct.</p> : null}

					<form method="POST" action="/api/idp/authorize">
						{/* No `id`, and a name that matches none of the username selectors. */}
						<input type="hidden" name="ident" value={identifier} />
						<input type="hidden" name="mode" value={mode} />
						<input type="hidden" name="next" value={next} />
						<input type="hidden" name="step" value="password" />
						<div className={styles.field}>
							<label className={styles.label} htmlFor="password">Password</label>
							<input
								className={styles.input}
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
							/>
						</div>
						<button className={styles.button} type="submit">Sign in</button>
					</form>
				</div>
			</main>
		);
	}

	// Step one: the identifier only. No password field anywhere on this screen.
	return (
		<main className={styles.screen}>
			<div className={styles.card}>
				<p className={styles.brand}>Velt<span>ID</span></p>
				<h1 className={styles.title}>Sign in</h1>
				{fallbackBanner}
				<p className={styles.hint}>Use your organisation account to continue.</p>

				{failed ? <p className={styles.error}>We do not recognise that account.</p> : null}

				<form method="POST" action="/api/idp/authorize">
					<input type="hidden" name="mode" value={mode} />
					<input type="hidden" name="next" value={next} />
					<input type="hidden" name="step" value="identifier" />
					<div className={styles.field}>
						<label className={styles.label} htmlFor="identifier">Username</label>
						<input
							className={styles.input}
							id="identifier"
							name="identifier"
							type="email"
							autoComplete="username"
							required
						/>
					</div>
					<button className={styles.button} type="submit">Next</button>
				</form>
			</div>
		</main>
	);
}

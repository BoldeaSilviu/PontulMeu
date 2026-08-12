import { sql } from "@vercel/postgres";

/**
 * Inițializează tabelele bazei de date.
 * Toate modificările de schemă sunt idempotente (IF NOT EXISTS).
 */
export async function initDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      name VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      email_verified BOOLEAN DEFAULT FALSE,

      -- Abonament
      plan VARCHAR(20) DEFAULT 'free',
      subscription_status VARCHAR(50) DEFAULT 'none',
      stripe_customer_id VARCHAR(255),
      stripe_subscription_id VARCHAR(255),
      subscription_end_date TIMESTAMP,
      trial_end_date TIMESTAMP
    );
  `;

  // CotaVerde 2.0: câmpuri extinse de profil + rol + blocare
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT FALSE`;

  await sql`
    CREATE TABLE IF NOT EXISTS analysis_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      match_id VARCHAR(100),
      home_team VARCHAR(255),
      away_team VARCHAR(255),
      league VARCHAR(255),
      analysis_data JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_history_user_date
    ON analysis_history(user_id, created_at DESC);
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS favorites (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      team_id VARCHAR(100),
      team_name VARCHAR(255),
      league VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, team_id)
    );
  `;

  // Tokenuri de resetare parolă (valabile 1 oră)
  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(128) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  // Tokenuri de confirmare email
  await sql`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(128) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  return true;
}

/**
 * Find user by email
 */
export async function findUserByEmail(email) {
  const { rows } = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()}`;
  return rows[0] || null;
}

/**
 * Find user by ID
 */
export async function findUserById(id) {
  const { rows } = await sql`SELECT * FROM users WHERE id = ${id}`;
  return rows[0] || null;
}

/**
 * Create new user (CotaVerde 2.0: profil complet obligatoriu)
 */
export async function createUser({ email, passwordHash, firstName, lastName, phone, birthDate }) {
  // 7-day trial on registration
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);

  const fullName = `${firstName} ${lastName}`.trim();

  const { rows } = await sql`
    INSERT INTO users (email, password_hash, name, first_name, last_name, phone, birth_date, plan, trial_end_date)
    VALUES (${email.toLowerCase()}, ${passwordHash}, ${fullName}, ${firstName}, ${lastName}, ${phone}, ${birthDate}, 'free', ${trialEnd.toISOString()})
    RETURNING *
  `;
  return rows[0];
}

/**
 * Check if user has Premium access (admin OR active subscription OR trial)
 */
export function isUserPremium(user) {
  if (!user) return false;
  if (user.blocked) return false;

  // Administratorii au acces total permanent
  if (user.role === "admin") return true;

  // Active paid subscription
  if (user.plan === "premium" && user.subscription_status === "active") {
    if (!user.subscription_end_date) return true;
    return new Date(user.subscription_end_date) > new Date();
  }

  // Trial period
  if (user.trial_end_date && new Date(user.trial_end_date) > new Date()) {
    return true;
  }

  return false;
}

export function isUserAdmin(user) {
  return !!user && user.role === "admin";
}

/**
 * Count analyses made today by user
 */
export async function countTodayAnalyses(userId) {
  const { rows } = await sql`
    SELECT COUNT(*)::int as count
    FROM analysis_history
    WHERE user_id = ${userId}
      AND created_at >= CURRENT_DATE
      AND created_at < CURRENT_DATE + INTERVAL '1 day'
  `;
  return rows[0]?.count || 0;
}

/**
 * Save analysis to history
 */
export async function saveAnalysis({ userId, matchId, homeTeam, awayTeam, league, analysisData }) {
  await sql`
    INSERT INTO analysis_history (user_id, match_id, home_team, away_team, league, analysis_data)
    VALUES (${userId}, ${matchId}, ${homeTeam}, ${awayTeam}, ${league}, ${JSON.stringify(analysisData)})
  `;
}

/**
 * Get user's analysis history
 */
export async function getUserHistory(userId, limit = 50) {
  const { rows } = await sql`
    SELECT * FROM analysis_history
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows;
}

/**
 * Update user subscription status (called by Stripe webhook)
 */
export async function updateUserSubscription(userId, updates) {
  const { plan, subscription_status, stripe_customer_id, stripe_subscription_id, subscription_end_date } = updates;
  await sql`
    UPDATE users SET
      plan = COALESCE(${plan}, plan),
      subscription_status = COALESCE(${subscription_status}, subscription_status),
      stripe_customer_id = COALESCE(${stripe_customer_id}, stripe_customer_id),
      subscription_end_date = COALESCE(${subscription_end_date}, subscription_end_date),
      stripe_subscription_id = COALESCE(${stripe_subscription_id}, stripe_subscription_id)
    WHERE id = ${userId}
  `;
}

export async function findUserByStripeCustomer(customerId) {
  const { rows } = await sql`SELECT * FROM users WHERE stripe_customer_id = ${customerId}`;
  return rows[0] || null;
}

/* ============================================================
 * RESETARE PAROLĂ + CONFIRMARE EMAIL
 * ============================================================ */

export async function createPasswordResetToken(userId, token) {
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 oră
  await sql`
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expires.toISOString()})
  `;
}

export async function findValidResetToken(token) {
  const { rows } = await sql`
    SELECT * FROM password_reset_tokens
    WHERE token = ${token} AND used = FALSE AND expires_at > NOW()
  `;
  return rows[0] || null;
}

export async function consumeResetToken(tokenId, userId, newPasswordHash) {
  await sql`UPDATE password_reset_tokens SET used = TRUE WHERE id = ${tokenId}`;
  await sql`UPDATE users SET password_hash = ${newPasswordHash} WHERE id = ${userId}`;
}

export async function createEmailVerificationToken(userId, token) {
  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 ore
  await sql`
    INSERT INTO email_verification_tokens (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expires.toISOString()})
  `;
}

export async function verifyEmailByToken(token) {
  const { rows } = await sql`
    SELECT * FROM email_verification_tokens
    WHERE token = ${token} AND expires_at > NOW()
  `;
  const row = rows[0];
  if (!row) return null;
  await sql`UPDATE users SET email_verified = TRUE WHERE id = ${row.user_id}`;
  await sql`DELETE FROM email_verification_tokens WHERE id = ${row.id}`;
  return row.user_id;
}

/* ============================================================
 * ADMINISTRARE UTILIZATORI
 * ============================================================ */

export async function listUsers({ search = "", limit = 200 } = {}) {
  const like = `%${search}%`;
  const { rows } = await sql`
    SELECT id, email, first_name, last_name, name, phone, birth_date,
           plan, subscription_status, trial_end_date, role, blocked,
           email_verified, created_at,
           (SELECT COUNT(*)::int FROM analysis_history ah WHERE ah.user_id = users.id) AS analyses_count
    FROM users
    WHERE (${search} = '' OR email ILIKE ${like} OR name ILIKE ${like} OR phone ILIKE ${like})
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows;
}

export async function adminStats() {
  const { rows } = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM users) AS total_users,
      (SELECT COUNT(*)::int FROM users WHERE plan = 'premium' AND subscription_status = 'active') AS premium_users,
      (SELECT COUNT(*)::int FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS new_7d,
      (SELECT COUNT(*)::int FROM analysis_history) AS total_analyses,
      (SELECT COUNT(*)::int FROM analysis_history WHERE created_at >= CURRENT_DATE) AS analyses_today
  `;
  return rows[0];
}

export async function setUserBlocked(userId, blocked) {
  await sql`UPDATE users SET blocked = ${blocked} WHERE id = ${userId}`;
}

export async function setUserPremium(userId, premium) {
  if (premium) {
    await sql`UPDATE users SET plan = 'premium', subscription_status = 'active', subscription_end_date = NULL WHERE id = ${userId}`;
  } else {
    await sql`UPDATE users SET plan = 'free', subscription_status = 'none', subscription_end_date = NULL WHERE id = ${userId}`;
  }
}

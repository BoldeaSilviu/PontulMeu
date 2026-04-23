import { sql } from "@vercel/postgres";

/**
 * Inițializează tabelele bazei de date.
 * Se rulează automat la primul request dacă tabelele nu există.
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
 * Create new user
 */
export async function createUser({ email, passwordHash, name }) {
  // 7-day trial on registration
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);

  const { rows } = await sql`
    INSERT INTO users (email, password_hash, name, plan, trial_end_date)
    VALUES (${email.toLowerCase()}, ${passwordHash}, ${name}, 'free', ${trialEnd.toISOString()})
    RETURNING *
  `;
  return rows[0];
}

/**
 * Check if user has Premium access (active subscription OR trial)
 */
export function isUserPremium(user) {
  if (!user) return false;

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
      stripe_subscription_id = COALESCE(${stripe_subscription_id}, stripe_subscription_id),
      subscription_end_date = COALESCE(${subscription_end_date}, subscription_end_date)
    WHERE id = ${userId}
  `;
}

export async function findUserByStripeCustomer(customerId) {
  const { rows } = await sql`SELECT * FROM users WHERE stripe_customer_id = ${customerId}`;
  return rows[0] || null;
}

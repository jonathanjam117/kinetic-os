export const SUPABASE_POSTGRESQL_SCHEMA = `-- ==============================================================================
-- KINETIC // OS — High-Performance Personal Telemetry Database Schema
-- Compatible with: Supabase / PostgreSQL 15+
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Biometric Profiles (Active & Historical Snapshots)
CREATE TABLE IF NOT EXISTS user_biometrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    weight_kg NUMERIC(5,2) NOT NULL,
    height_cm NUMERIC(5,1) NOT NULL,
    age INT NOT NULL,
    sex VARCHAR(10) CHECK (sex IN ('male', 'female')) NOT NULL,
    activity_level VARCHAR(20) CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'heavy', 'athlete')) NOT NULL,
    goal VARCHAR(20) CHECK (goal IN ('cut', 'maintenance', 'bulk')) NOT NULL,
    protein_per_kg NUMERIC(3,2) DEFAULT 2.00,
    fat_per_kg NUMERIC(3,2) DEFAULT 0.90,
    water_ml_per_kg INT DEFAULT 35,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Weight Telemetry Records (Scale Weight + 7-Day EMA)
CREATE TABLE IF NOT EXISTS weight_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    scale_weight_kg NUMERIC(5,2) NOT NULL,
    ema_weight_kg NUMERIC(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, record_date)
);

-- 4. Workout Routines & Exercise Templates
CREATE TABLE IF NOT EXISTS workout_routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    focus VARCHAR(100),
    estimated_minutes INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routine_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routine_id UUID REFERENCES workout_routines(id) ON DELETE CASCADE,
    exercise_name VARCHAR(100) NOT NULL,
    muscle_group VARCHAR(100) NOT NULL,
    modality VARCHAR(20) CHECK (modality IN ('bodyweight', 'isometric', 'weighted')) NOT NULL,
    progression_levels JSONB DEFAULT '[]'::jsonb,
    target_notes TEXT,
    rest_seconds INT DEFAULT 90,
    order_index INT NOT NULL
);

-- 5. Workout Session Execution Logs (Strong/Hevy Style History)
CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    routine_id UUID REFERENCES workout_routines(id) ON DELETE SET NULL,
    routine_name VARCHAR(100) NOT NULL,
    session_date DATE NOT NULL,
    duration_minutes INT DEFAULT 0,
    total_volume_kg NUMERIC(8,2) DEFAULT 0,
    total_sets_completed INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_set_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_name VARCHAR(100) NOT NULL,
    modality VARCHAR(20) NOT NULL,
    set_number INT NOT NULL,
    weight_kg NUMERIC(6,2),
    reps_or_seconds INT NOT NULL,
    rir INT CHECK (rir BETWEEN 0 AND 4),
    progression_variant VARCHAR(100),
    completed BOOLEAN DEFAULT TRUE,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Curated Food Items & Daily Nutrition Logs
CREATE TABLE IF NOT EXISTS food_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    category VARCHAR(30) NOT NULL,
    serving_grams NUMERIC(6,1) DEFAULT 100.0,
    calories_per_100g NUMERIC(6,1) NOT NULL,
    protein_per_100g NUMERIC(5,2) NOT NULL,
    carbs_per_100g NUMERIC(5,2) NOT NULL,
    fat_per_100g NUMERIC(5,2) NOT NULL,
    description TEXT,
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_meal_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    food_id UUID REFERENCES food_items(id) ON DELETE SET NULL,
    food_name VARCHAR(150) NOT NULL,
    meal_block VARCHAR(30) CHECK (meal_block IN ('pre_workout', 'post_workout', 'main_meal', 'snack_night')) NOT NULL,
    grams NUMERIC(6,2) NOT NULL,
    calories NUMERIC(6,1) NOT NULL,
    protein NUMERIC(5,2) NOT NULL,
    carbs NUMERIC(5,2) NOT NULL,
    fat NUMERIC(5,2) NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_hydration_and_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    water_intake_ml INT DEFAULT 0,
    creatine_checked BOOLEAN DEFAULT FALSE,
    creatine_grams NUMERIC(4,1) DEFAULT 0,
    protein_checked BOOLEAN DEFAULT FALSE,
    hydration_checked BOOLEAN DEFAULT FALSE,
    sleep_recovery_checked BOOLEAN DEFAULT FALSE,
    sleep_hours NUMERIC(3,1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, log_date)
);

-- 7. Row Level Security (RLS) Policy Setup
ALTER TABLE user_biometrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_set_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_hydration_and_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own biometrics" ON user_biometrics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own weight records" ON weight_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own workout sessions" ON workout_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own meal logs" ON daily_meal_logs FOR ALL USING (auth.uid() = user_id);
`;

export const SQLITE_LOCAL_SCHEMA = `-- ==============================================================================
-- KINETIC // OS — SQLite Local Offline Schema
-- Compatible with: SQLite 3.35+, Turso, Cloudflare D1
-- ==============================================================================

CREATE TABLE IF NOT EXISTS user_biometrics (
    id TEXT PRIMARY KEY,
    weight_kg REAL NOT NULL,
    height_cm REAL NOT NULL,
    age INTEGER NOT NULL,
    sex TEXT NOT NULL,
    activity_level TEXT NOT NULL,
    goal TEXT NOT NULL,
    protein_per_kg REAL DEFAULT 2.0,
    fat_per_kg REAL DEFAULT 0.9,
    water_ml_per_kg INTEGER DEFAULT 35,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS weight_records (
    id TEXT PRIMARY KEY,
    record_date TEXT NOT NULL UNIQUE,
    scale_weight_kg REAL NOT NULL,
    ema_weight_kg REAL,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workout_sessions (
    id TEXT PRIMARY KEY,
    routine_id TEXT,
    routine_name TEXT NOT NULL,
    session_date TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 0,
    total_volume_kg REAL DEFAULT 0,
    total_sets_completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workout_set_logs (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    modality TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    weight_kg REAL,
    reps_or_seconds INTEGER NOT NULL,
    rir INTEGER,
    progression_variant TEXT,
    completed INTEGER DEFAULT 1,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_meal_logs (
    id TEXT PRIMARY KEY,
    log_date TEXT NOT NULL,
    food_id TEXT,
    food_name TEXT NOT NULL,
    meal_block TEXT NOT NULL,
    grams REAL NOT NULL,
    calories REAL NOT NULL,
    protein REAL NOT NULL,
    carbs REAL NOT NULL,
    fat REAL NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_checklists (
    id TEXT PRIMARY KEY,
    log_date TEXT NOT NULL UNIQUE,
    creatine_checked INTEGER DEFAULT 0,
    creatine_grams REAL DEFAULT 0,
    protein_checked INTEGER DEFAULT 0,
    hydration_checked INTEGER DEFAULT 0,
    sleep_recovery_checked INTEGER DEFAULT 0,
    sleep_hours REAL,
    water_intake_ml INTEGER DEFAULT 0
);
`;

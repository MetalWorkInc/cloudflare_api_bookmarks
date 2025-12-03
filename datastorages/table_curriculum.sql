-- Table for D1 CurriculumVitae Database

DROP TABLE IF EXISTS curriculum_vitae;

CREATE TABLE curriculum_vitae (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    summary TEXT,
    education TEXT, -- JSON array stored as string
    experience TEXT, -- JSON array stored as string
    skills TEXT, -- JSON array stored as string
    languages TEXT, -- JSON array stored as string
    certifications TEXT, -- JSON array stored as string
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Indexes for faster queries
CREATE INDEX idx_cv_created_at ON curriculum_vitae(created_at DESC);
CREATE INDEX idx_cv_email ON curriculum_vitae(email);
CREATE INDEX idx_cv_full_name ON curriculum_vitae(full_name);

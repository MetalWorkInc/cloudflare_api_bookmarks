-- Table for D1 Partners Environment Database

DROP TABLE IF EXISTS partners_environment;

CREATE TABLE partners_environment (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE, -- Encrypted text key
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    summary TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    bookmarks_favorites TEXT
);

-- Indexes for faster queries
CREATE INDEX idx_partners_created_at ON partners_environment(created_at DESC);
CREATE INDEX idx_partners_email ON partners_environment(email);
CREATE INDEX idx_partners_key ON partners_environment(key);

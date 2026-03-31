-- Table for D1 Calendar Agenda Database

DROP TABLE IF EXISTS event_change_requests;
DROP TABLE IF EXISTS event_participants;
DROP TABLE IF EXISTS event_recurrence;
DROP TABLE IF EXISTS event_reminders;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS calendars;

CREATE TABLE calendars (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    timezone TEXT NOT NULL,
    color TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE events (
    id TEXT PRIMARY KEY,
    calendar_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_at_utc TEXT NOT NULL,
    end_at_utc TEXT NOT NULL,
    is_all_day INTEGER NOT NULL DEFAULT 0,
    is_exclusive INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'confirmed',
    visibility TEXT NOT NULL DEFAULT 'private',
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
    CHECK (end_at_utc > start_at_utc),
    CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
    CHECK (visibility IN ('private', 'public'))
);

CREATE TABLE event_recurrence (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL UNIQUE,
    rrule TEXT NOT NULL,
    dtstart_utc TEXT NOT NULL,
    until_utc TEXT,
    count INTEGER,
    timezone TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE event_reminders (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    minutes_before INTEGER NOT NULL,
    channel TEXT NOT NULL DEFAULT 'app',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CHECK (minutes_before >= 0),
    CHECK (channel IN ('app', 'email', 'webhook'))
);

CREATE TABLE event_participants (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    age INTEGER,
    phone TEXT,
    company TEXT,
    role_label TEXT,
    notes TEXT,
    raw_payload TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CHECK (age IS NULL OR age >= 0)
);

CREATE TABLE event_change_requests (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    requested_by TEXT NOT NULL,
    requested_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by TEXT,
    reviewed_at TEXT,
    review_note TEXT,
    original_title TEXT,
    original_description TEXT,
    original_location TEXT,
    original_start_at_utc TEXT NOT NULL,
    original_end_at_utc TEXT NOT NULL,
    original_is_all_day INTEGER NOT NULL DEFAULT 0,
    original_is_exclusive INTEGER NOT NULL DEFAULT 0,
    desired_title TEXT,
    desired_description TEXT,
    desired_location TEXT,
    desired_start_at_utc TEXT NOT NULL,
    desired_end_at_utc TEXT NOT NULL,
    desired_is_all_day INTEGER NOT NULL DEFAULT 0,
    desired_is_exclusive INTEGER NOT NULL DEFAULT 0,
    reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    CHECK (original_end_at_utc > original_start_at_utc),
    CHECK (desired_end_at_utc > desired_start_at_utc)
);

-- Indexes for faster queries
CREATE INDEX idx_calendars_owner ON calendars(owner_user_id);
CREATE INDEX idx_calendars_created_at ON calendars(created_at DESC);

CREATE INDEX idx_events_calendar_start ON events(calendar_id, start_at_utc);
CREATE INDEX idx_events_calendar_end ON events(calendar_id, end_at_utc);
CREATE INDEX idx_events_start_at ON events(start_at_utc);
CREATE INDEX idx_events_is_exclusive ON events(is_exclusive);

CREATE INDEX idx_recurrence_event_id ON event_recurrence(event_id);

CREATE INDEX idx_reminders_event_id ON event_reminders(event_id);

CREATE INDEX idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX idx_event_participants_email ON event_participants(email);
CREATE INDEX idx_event_participants_name ON event_participants(full_name);

CREATE INDEX idx_change_requests_event_id ON event_change_requests(event_id);
CREATE INDEX idx_change_requests_status ON event_change_requests(status);
CREATE INDEX idx_change_requests_requested_at ON event_change_requests(requested_at DESC);

-- Enforce exclusivity in same calendar and overlapping time ranges.
-- Conflict occurs when either the new event or the existing one is exclusive.
CREATE TRIGGER trg_events_exclusive_insert
BEFORE INSERT ON events
FOR EACH ROW
BEGIN
    SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM events e
            WHERE e.calendar_id = NEW.calendar_id
              AND e.id <> NEW.id
              AND NEW.start_at_utc < e.end_at_utc
              AND NEW.end_at_utc > e.start_at_utc
              AND (NEW.is_exclusive = 1 OR e.is_exclusive = 1)
        )
        THEN RAISE(ABORT, 'Exclusive event conflict in selected time range')
    END;
END;

CREATE TRIGGER trg_events_exclusive_update
BEFORE UPDATE ON events
FOR EACH ROW
BEGIN
    SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM events e
            WHERE e.calendar_id = NEW.calendar_id
              AND e.id <> NEW.id
              AND NEW.start_at_utc < e.end_at_utc
              AND NEW.end_at_utc > e.start_at_utc
              AND (NEW.is_exclusive = 1 OR e.is_exclusive = 1)
        )
        THEN RAISE(ABORT, 'Exclusive event conflict in selected time range')
    END;
END;

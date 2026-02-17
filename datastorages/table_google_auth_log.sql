-- Table for D1 Partners Environment Database

DROP TABLE IF EXISTS google_auth_log;

CREATE TABLE google_auth_log (
	id TEXT PRIMARY KEY,
	iss TEXT,
	azp TEXT,
	aud TEXT,
	sub TEXT,
	email TEXT,
	email_verified INTEGER,
	nbf INTEGER,
	name TEXT,
	picture TEXT,
	given_name TEXT,
	family_name TEXT,
	iat INTEGER,
	exp INTEGER,
	jti TEXT,
    created_at TEXT NOT NULL
);

-- Indexes for faster queries
CREATE INDEX idx_google_auth_log_created_at ON google_auth_log(created_at DESC);
CREATE INDEX idx_google_auth_log_email ON google_auth_log(email);


/*
{
	"iss": "https://accounts.google.com",
	"azp": "340607393200-sognpr7o41vqmo3ncvp4escknobkna7l.apps.googleusercontent.com",
	"aud": "340607393200-sognpr7o41vqmo3ncvp4escknobkna7l.apps.googleusercontent.com",
	"sub": "112385457695514776780",
	"email": "echoes.daniel@gmail.com",
	"email_verified": true,
	"nbf": 1771291792,
	"name": "DanieLin Leiva",
	"picture": "https://lh3.googleusercontent.com/a/ACg8ocIrmMozwCMvEYx7eGs1nMz5VFPxOIC2-aStVshmf0vQjwOJRllY=s96-c",
	"given_name": "DanieLin",
	"family_name": "Leiva",
	"iat": 1771292092,
	"exp": 1771295692,
	"jti": "79f3190752e2becc0b91ba407a50ce389a6d360b"
}
*/
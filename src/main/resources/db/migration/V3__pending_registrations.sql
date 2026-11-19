-- Sign-ups waiting for the emailed verification code. A row becomes a real user only after the code is verified.
CREATE TABLE pending_registrations (
    email          VARCHAR(160) PRIMARY KEY,
    full_name      VARCHAR(120) NOT NULL,
    role           VARCHAR(20)  NOT NULL,
    password_hash  VARCHAR(100) NOT NULL,
    blood_type     VARCHAR(3),
    phone          VARCHAR(40),
    employee_id    VARCHAR(60),
    bank_id        BIGINT,
    code_hash      VARCHAR(100) NOT NULL,
    attempts       INTEGER      NOT NULL DEFAULT 0,
    expires_at     TIMESTAMPTZ  NOT NULL,
    last_sent_at   TIMESTAMPTZ  NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_pending_role CHECK (role IN ('DONOR', 'RECIPIENT', 'STAFF'))
);
CREATE INDEX idx_pending_registrations_expires ON pending_registrations (expires_at);

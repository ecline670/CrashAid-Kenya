CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE users (
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'victim' CHECK (role IN ('victim','dispatcher','admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE providers (
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT,
  type TEXT NOT NULL CHECK (type IN ('ambulance','hospital','police','insurer','lawyer','mechanic')),
  location GEOGRAPHY(Point,4326)
);
CREATE TABLE units (
  id SERIAL PRIMARY KEY, provider_id INT REFERENCES providers(id), callsign TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'ambulance',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','dispatched','offline')),
  location GEOGRAPHY(Point,4326), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE incidents (
  id SERIAL PRIMARY KEY, reporter_id INT REFERENCES users(id), description TEXT DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'unknown' CHECK (severity IN ('minor','serious','critical','unknown')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','dispatched','en_route','on_scene','resolved','cancelled')),
  location GEOGRAPHY(Point,4326) NOT NULL, assigned_unit_id INT REFERENCES units(id),
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE incident_events (
  id SERIAL PRIMARY KEY, incident_id INT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  actor_id INT REFERENCES users(id), note TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX units_loc_idx ON units USING GIST (location);
CREATE INDEX incidents_loc_idx ON incidents USING GIST (location);
CREATE INDEX incidents_status_idx ON incidents (status);

-- Reference data (coordinates are approximate; replace with verified ones)
INSERT INTO providers (name, phone, type, location) VALUES
 ('AAR Ambulance',     '+254 20 2715318', 'ambulance', ST_MakePoint(36.8108,-1.2676)::geography),
 ('St. John Kenya',    '+254 20 2210000', 'ambulance', ST_MakePoint(36.8070,-1.2990)::geography),
 ('Aga Khan Hospital', '+254 20 3662000', 'hospital',  ST_MakePoint(36.8156,-1.2634)::geography),
 ('KPS Westlands',     '999',             'police',    ST_MakePoint(36.8030,-1.2658)::geography),
 ('AA Kenya Recovery', '+254 20 3868000', 'mechanic',  ST_MakePoint(36.8200,-1.3020)::geography);
INSERT INTO units (provider_id, callsign, type, location) VALUES
 (1,'AAR-01','ambulance', ST_MakePoint(36.8110,-1.2680)::geography),
 (1,'AAR-02','ambulance', ST_MakePoint(36.7800,-1.2600)::geography),
 (2,'SJK-01','ambulance', ST_MakePoint(36.8075,-1.2985)::geography),
 (2,'SJK-02','ambulance', ST_MakePoint(36.8900,-1.2900)::geography);

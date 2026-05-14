-- LastDance Database Schema

-- 1. Schools Table
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  event_date DATE,
  base_price DECIMAL(10,2) DEFAULT 65.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. School Codes Table
CREATE TABLE IF NOT EXISTS school_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code CHAR(8) UNIQUE NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Registrations Table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  nif TEXT NOT NULL,
  dob DATE NOT NULL,
  nationality TEXT DEFAULT 'Portuguesa',
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  payment_entity TEXT DEFAULT '21054',
  payment_reference TEXT,
  amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Content/CMS Table
CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial content
INSERT INTO site_content (key, value) VALUES 
('hero_title', 'A Celebração do Teu Último Capítulo'),
('hero_subtitle', 'A LastDance cria experiências memoráveis para o teu final de ciclo.');

-- Enable Row Level Security (Optional but recommended for production)
-- ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable insert for everyone" ON registrations FOR INSERT WITH CHECK (true);

-- Insert application types for different roles
INSERT INTO application_types (name, description, form_fields, is_active) VALUES
(
  'Politi Ansøgning',
  'Ansøgning om at blive en del af politistyrken',
  '[
    {"id": "full_name", "label": "Fulde navn", "type": "text", "required": true},
    {"id": "age", "label": "Alder", "type": "number", "required": true},
    {"id": "discord", "label": "Discord brugernavn", "type": "text", "required": true},
    {"id": "experience", "label": "Tidligere erfaring med politi-RP", "type": "textarea", "required": true},
    {"id": "motivation", "label": "Hvorfor vil du være politibetjent?", "type": "textarea", "required": true},
    {"id": "scenarios", "label": "Hvordan ville du håndtere en voldelig situation?", "type": "textarea", "required": true},
    {"id": "availability", "label": "Hvor mange timer kan du være aktiv om ugen?", "type": "text", "required": true}
  ]'::jsonb,
  true
),
(
  'Læge Ansøgning',
  'Ansøgning om at blive læge/sundhedspersonale',
  '[
    {"id": "full_name", "label": "Fulde navn", "type": "text", "required": true},
    {"id": "age", "label": "Alder", "type": "number", "required": true},
    {"id": "discord", "label": "Discord brugernavn", "type": "text", "required": true},
    {"id": "medical_knowledge", "label": "Har du kendskab til medicinsk RP?", "type": "textarea", "required": true},
    {"id": "motivation", "label": "Hvorfor vil du arbejde som læge?", "type": "textarea", "required": true},
    {"id": "emergency_handling", "label": "Hvordan ville du håndtere en nødsituation?", "type": "textarea", "required": true},
    {"id": "availability", "label": "Hvor mange timer kan du være aktiv om ugen?", "type": "text", "required": true}
  ]'::jsonb,
  true
),
(
  'Bande Ansøgning',
  'Ansøgning om at oprette eller tilslutte sig en bande',
  '[
    {"id": "gang_name", "label": "Bandens navn", "type": "text", "required": true},
    {"id": "leader_name", "label": "Lederens navn", "type": "text", "required": true},
    {"id": "discord", "label": "Discord brugernavn", "type": "text", "required": true},
    {"id": "member_count", "label": "Antal medlemmer", "type": "number", "required": true},
    {"id": "gang_description", "label": "Beskriv jeres bande og baggrund", "type": "textarea", "required": true},
    {"id": "territory", "label": "Hvilket område vil I operere i?", "type": "text", "required": true},
    {"id": "rp_style", "label": "Hvilken type RP vil I fokusere på?", "type": "textarea", "required": true},
    {"id": "rules_understanding", "label": "Bekræfter du at følge serverens regler?", "type": "checkbox", "required": true}
  ]'::jsonb,
  true
),
(
  'Ejendomsmægler Ansøgning',
  'Ansøgning om at blive ejendomsmægler',
  '[
    {"id": "full_name", "label": "Fulde navn", "type": "text", "required": true},
    {"id": "age", "label": "Alder", "type": "number", "required": true},
    {"id": "discord", "label": "Discord brugernavn", "type": "text", "required": true},
    {"id": "sales_experience", "label": "Har du erfaring med salg eller forhandling?", "type": "textarea", "required": true},
    {"id": "motivation", "label": "Hvorfor vil du være ejendomsmægler?", "type": "textarea", "required": true},
    {"id": "business_plan", "label": "Hvordan vil du drive din forretning?", "type": "textarea", "required": true},
    {"id": "availability", "label": "Hvor mange timer kan du være aktiv om ugen?", "type": "text", "required": true}
  ]'::jsonb,
  true
),
(
  'Advokat Ansøgning',
  'Ansøgning om at blive advokat',
  '[
    {"id": "full_name", "label": "Fulde navn", "type": "text", "required": true},
    {"id": "age", "label": "Alder", "type": "number", "required": true},
    {"id": "discord", "label": "Discord brugernavn", "type": "text", "required": true},
    {"id": "legal_knowledge", "label": "Har du kendskab til juridisk RP?", "type": "textarea", "required": true},
    {"id": "motivation", "label": "Hvorfor vil du være advokat?", "type": "textarea", "required": true},
    {"id": "case_handling", "label": "Hvordan ville du håndtere en vanskelig sag?", "type": "textarea", "required": true},
    {"id": "server_laws", "label": "Kender du til serverens love?", "type": "textarea", "required": true},
    {"id": "availability", "label": "Hvor mange timer kan du være aktiv om ugen?", "type": "text", "required": true}
  ]'::jsonb,
  true
),
(
  'Dommer Ansøgning',
  'Ansøgning om at blive dommer',
  '[
    {"id": "full_name", "label": "Fulde navn", "type": "text", "required": true},
    {"id": "age", "label": "Alder", "type": "number", "required": true},
    {"id": "discord", "label": "Discord brugernavn", "type": "text", "required": true},
    {"id": "legal_experience", "label": "Tidligere erfaring med juridisk RP", "type": "textarea", "required": true},
    {"id": "motivation", "label": "Hvorfor vil du være dommer?", "type": "textarea", "required": true},
    {"id": "impartiality", "label": "Hvordan sikrer du upartiskhed i domstolen?", "type": "textarea", "required": true},
    {"id": "server_laws", "label": "Hvor godt kender du til serverens love?", "type": "textarea", "required": true},
    {"id": "availability", "label": "Hvor mange timer kan du være aktiv om ugen?", "type": "text", "required": true}
  ]'::jsonb,
  true
),
(
  'Firma Ansøgning',
  'Ansøgning om at oprette en virksomhed',
  '[
    {"id": "company_name", "label": "Firmanavn", "type": "text", "required": true},
    {"id": "owner_name", "label": "Ejerens navn", "type": "text", "required": true},
    {"id": "discord", "label": "Discord brugernavn", "type": "text", "required": true},
    {"id": "business_type", "label": "Type virksomhed", "type": "text", "required": true},
    {"id": "business_description", "label": "Beskriv din forretningsidé", "type": "textarea", "required": true},
    {"id": "services", "label": "Hvilke services vil I tilbyde?", "type": "textarea", "required": true},
    {"id": "location", "label": "Hvor vil virksomheden være placeret?", "type": "text", "required": true},
    {"id": "employees", "label": "Hvor mange ansatte forventer du?", "type": "number", "required": true},
    {"id": "business_plan", "label": "Forretningsplan", "type": "textarea", "required": true}
  ]'::jsonb,
  true
),
(
  'Staff Ansøgning',
  'Ansøgning om at blive en del af staff-teamet',
  '[
    {"id": "full_name", "label": "Fulde navn", "type": "text", "required": true},
    {"id": "age", "label": "Alder", "type": "number", "required": true},
    {"id": "discord", "label": "Discord brugernavn", "type": "text", "required": true},
    {"id": "position", "label": "Hvilken staff-rolle søger du?", "type": "select", "options": ["Moderator", "Admin", "Developer", "Support"], "required": true},
    {"id": "experience", "label": "Tidligere erfaring som staff", "type": "textarea", "required": true},
    {"id": "motivation", "label": "Hvorfor vil du være en del af staff?", "type": "textarea", "required": true},
    {"id": "strengths", "label": "Hvad er dine styrker?", "type": "textarea", "required": true},
    {"id": "availability", "label": "Hvor mange timer kan du være aktiv om ugen?", "type": "text", "required": true},
    {"id": "scenario", "label": "Hvordan ville du håndtere en konflikt mellem spillere?", "type": "textarea", "required": true}
  ]'::jsonb,
  true
);
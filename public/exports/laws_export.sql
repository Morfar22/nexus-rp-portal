-- =====================================================
-- NEXUS RP - LAWS DATABASE EXPORT
-- Generated: 2025-01-09
-- Total records: All active laws
-- =====================================================

-- Drop existing table if exists (optional - remove if you want to keep existing data)
-- DROP TABLE IF EXISTS public.laws;

-- Create laws table
CREATE TABLE IF NOT EXISTS public.laws (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  fine_amount INTEGER DEFAULT 0,
  jail_time_minutes INTEGER DEFAULT 0,
  severity_level TEXT NOT NULL DEFAULT 'Minor',
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.laws ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active laws" ON public.laws FOR SELECT USING (is_active = true);
CREATE POLICY "Can manage laws with permission" ON public.laws FOR ALL USING (has_permission(auth.uid(), 'laws.manage'));

-- Clear existing laws data (optional - remove if you want to append)
-- TRUNCATE TABLE public.laws;

-- =====================================================
-- INSERT ALL LAWS DATA
-- =====================================================

INSERT INTO public.laws (title, description, category, fine_amount, jail_time_minutes, severity_level, order_index, is_active) VALUES
-- Færdselsloven-Flugt
('§ 6.1.1 Flugt fra politiet i bil/motorcykel', 'Undvigelse af politiet ved at køre væk i bil eller på motorcykel.', 'Færdselsloven-Flugt', 15000, 50400, 'Severe', 200, true),
('§ 6.1.2 Flugt fra politiet til fods', 'Undvigelse af politiet ved at løbe væk.', 'Færdselsloven-Flugt', 5000, 14400, 'Moderate', 201, true),
('§ 6.1.3 Flugt fra politiet i båd', 'Undvigelse af politiet ved at sejle væk i en båd.', 'Færdselsloven-Flugt', 10000, 43200, 'Moderate', 202, true),
('§ 6.1.4 Flugt fra politiet i helikopter/fly', 'Undvigelse af politiet ved at flygte i helikopter eller fly.', 'Færdselsloven-Flugt', 10000, 43200, 'Moderate', 203, true),
('§ 6.1.5 Flugt fra færdselsuheld med personskade', 'Undgåelse af ansvar efter en trafikulykke, hvor der er personskader.', 'Færdselsloven-Flugt', 15000, 50400, 'Severe', 204, true),
('§ 6.1.6 Flugt fra færdselsuheld uden personskade', 'Undgåelse af ansvar efter en trafikulykke, hvor der ikke er personskader.', 'Færdselsloven-Flugt', 5000, 14400, 'Moderate', 205, true),

-- Færdselsloven-Farlig kørsel
('§ 6.2.2 Kørsel uden hjelm', 'Kørsel på motorcykel eller knallert uden korrekt beskyttelse.', 'Færdselsloven-Farlig kørsel', 1500, 0, 'Minor', 210, true),
('§ 6.2.3 Overhaling på højre side', 'Ulovlig overhaling af et andet køretøj på højre side.', 'Færdselsloven-Farlig kørsel', 3000, 0, 'Minor', 211, true),
('§ 6.2.4 Manglende opmærksomhed i trafikken', 'Kørsel uden tilstrækkelig opmærksomhed på vej- og trafikforhold.', 'Færdselsloven-Farlig kørsel', 4500, 0, 'Minor', 212, true),
('§ 6.2.5 Uagtsom personskade ved vanvidsbilisme', 'Personskade forårsaget af uforsigtig kørsel under vanvidsbilisme.', 'Færdselsloven-Farlig kørsel', 6500, 7200, 'Severe', 213, true),
('§ 6.2.6 Brug af håndholdt teleudstyr under kørsel', 'Anvendelse af mobiltelefon eller andet udstyr, mens man kører.', 'Færdselsloven-Farlig kørsel', 1550, 0, 'Minor', 214, true),
('§ 6.2.7 Kørsel på baghjul', 'Kørsel hvor kun baghjulene er i kontakt med vejen, ofte i en stuntmæssig handling.', 'Færdselsloven-Farlig kørsel', 1850, 0, 'Minor', 215, true),
('§ 6.2.8 Unødig røg og støj', 'Kørsel der forårsager unødvendig røg eller støj fra køretøjet.', 'Færdselsloven-Farlig kørsel', 1000, 0, 'Minor', 216, true),
('§ 6.2.9 Kørsel i et usikkert køretøj', 'Kørsel i et køretøj, der ikke er i god og sikker stand.', 'Færdselsloven-Farlig kørsel', 3500, 0, 'Minor', 217, true),
('§ 6.2.10 Ulovligt modificerede køretøjer', 'Køretøjer ændret på en måde, der overtræder lovgivningen.', 'Færdselsloven-Farlig kørsel', 5500, 0, 'Minor', 218, true),
('§ 6.2.11 Uforsvarlig kørsel med gods', 'Transport af gods på en måde, der udgør en risiko for sikkerheden.', 'Færdselsloven-Farlig kørsel', 10000, 0, 'Moderate', 219, true),
('§ 6.2.12 Kørsel med knallert på motorvej', 'Kørsel på motorvej med en knallert, hvilket er ulovligt.', 'Færdselsloven-Farlig kørsel', 3500, 0, 'Moderate', 220, true),
('§ 6.2.13 Hasarderet kørsel', 'Farlig kørsel, hvor bilisten udviser hensynsløs adfærd i trafikken og skaber en betydelig risiko for andre trafikanter.', 'Færdselsloven-Farlig kørsel', 15000, 21600, 'Severe', 221, true),

-- Færdselsloven-Anvisninger
('§ 6.3.1 Færdselstavler/pile ikke respekteret', 'Ignorering af trafikskilte eller vejmarkeringer.', 'Færdselsloven-Anvisninger', 1500, 0, 'Minor', 230, true),
('§ 6.3.2 Kørsel mod færdselsretning', 'Kørsel i den modsatte retning af den tilladte færdselsretning.', 'Færdselsloven-Anvisninger', 10000, 0, 'Severe', 231, true),
('§ 6.3.3 Overskridelse af spærrelinje', 'Krydsning af en linje, der markerer en sikkerhedszone under overhaling.', 'Færdselsloven-Anvisninger', 5000, 0, 'Moderate', 232, true),
('§ 6.3.4 Kørsel over for rødt lys', 'Kørsel gennem en trafiklys, der viser rødt.', 'Færdselsloven-Anvisninger', 1500, 0, 'Minor', 233, true),
('§ 6.3.5 Ulovlig kørsel i nødspor', 'Kørsel i et nødspor, som er reserveret til nødsituationer.', 'Færdselsloven-Anvisninger', 3500, 0, 'Minor', 234, true),
('§ 6.3.6 Væddeløbskørsel på offentlig vej', 'Kørsel i høj hastighed eller konkurrence på offentlig vej.', 'Færdselsloven-Anvisninger', 8500, 0, 'Severe', 235, true),
('§ 6.3.7 Manglende fuldt stop ved stopskilt', 'Undladelse af at standse helt ved et stopskilt.', 'Færdselsloven-Anvisninger', 1500, 0, 'Minor', 236, true),
('§ 6.3.8 Kørsel over fuldt optrukne linjer', 'Krydsning af linjer, der markerer en forbudt zone på vejen.', 'Færdselsloven-Anvisninger', 2000, 0, 'Minor', 237, true),
('§ 6.3.9 Ulovlig u-vending', 'Udførelse af en vending på en vej, hvor det er ulovligt.', 'Færdselsloven-Anvisninger', 2000, 0, 'Minor', 238, true),

-- Færdselsloven-Gående
('§ 6.4.1 Færden på eller langs kørebanen', 'Kørsel eller ophold på kørebanen eller dens kanter, hvor det ikke er tilladt.', 'Færdselsloven-Gående', 1500, 0, 'Minor', 240, true),
('§ 6.4.2 Færden i nødspor', 'Kørsel eller ophold i nødsporet, som kun er beregnet til nødsituationer.', 'Færdselsloven-Gående', 3000, 0, 'Minor', 241, true),
('§ 6.4.3 Færden på motorvej', 'Kørsel på motorveje, hvor der er specifikke regler og hastighedsgrænser.', 'Færdselsloven-Gående', 5000, 0, 'Moderate', 242, true),

-- Færdselsloven-Cykel
('§ 6.5.1 Cykel - Kørsel over for rødt lys', 'Kørsel gennem et trafiklys, der viser rødt.', 'Færdselsloven-Cykel', 500, 0, 'Minor', 250, true),
('§ 6.5.2 Cykle midt på kørebanen', 'Cykling på en del af vejen, der er beregnet til biler.', 'Færdselsloven-Cykel', 1500, 0, 'Minor', 251, true),
('§ 6.5.3 Cykle på fortov', 'Cykling på fortovet, som er beregnet til fodgængere.', 'Færdselsloven-Cykel', 500, 0, 'Minor', 252, true),
('§ 6.5.4 Stuntcykling på offentlig vej', 'Udførelse af farlige eller ulovlige tricks på en cykel på offentlig vej.', 'Færdselsloven-Cykel', 800, 0, 'Minor', 253, true),
('§ 6.5.5 Cykling på motorvej', 'Cykling på en motorvej, hvor det er ulovligt og farligt.', 'Færdselsloven-Cykel', 2000, 0, 'Moderate', 254, true),
('§ 6.5.6 Cyklist i fodgængerfelt', 'Cykling i et område reserveret til fodgængere.', 'Færdselsloven-Cykel', 500, 0, 'Minor', 255, true),
('§ 6.5.7 Kørsel mod færdselsretning på cykel', 'Cykling i den modsatte retning af den tilladte færdselsretning.', 'Færdselsloven-Cykel', 1500, 0, 'Minor', 256, true),

-- Færdselsloven-Parkering
('§ 6.6.1 Ulovlig parkering', 'Parkering i områder, hvor det ikke er tilladt.', 'Færdselsloven-Parkering', 1000, 0, 'Minor', 260, true),
('§ 6.6.2 Parkering foran indgang', 'Parkering foran en bygnings indgang, der blokerer adgang.', 'Færdselsloven-Parkering', 1500, 0, 'Minor', 261, true),
('§ 6.6.3 Parkering på handicapplads', 'Ulovlig brug af parkeringspladser reserveret til handicappede.', 'Færdselsloven-Parkering', 3000, 0, 'Minor', 262, true),
('§ 6.6.4 Blokering af kørebane', 'Efterladelse af køretøj på en måde, der hindrer trafikken.', 'Færdselsloven-Parkering', 2500, 0, 'Minor', 263, true),
('§ 6.6.5 Parkering i fodgængerfelt', 'Parkering i et område beregnet til fodgængere.', 'Færdselsloven-Parkering', 2000, 0, 'Minor', 264, true),

-- Færdselsloven-Spirituskørsel
('§ 6.7.1 Spirituskørsel', 'Kørsel under påvirkning af alkohol.', 'Færdselsloven-Spirituskørsel', 5000, 7200, 'Severe', 270, true),
('§ 6.7.2 Narkotikakørsel', 'Kørsel under påvirkning af narkotika.', 'Færdselsloven-Spirituskørsel', 7500, 14400, 'Severe', 271, true),
('§ 6.7.3 Gentagen spirituskørsel', 'Gentagende overtrædelser af spirituskørsel.', 'Færdselsloven-Spirituskørsel', 15000, 28800, 'Severe', 272, true),

-- Færdselsloven-Kørekort
('§ 6.8.1 Kørsel uden gyldig førerret', 'Kørsel af køretøj uden at have en lovligt gyldig kørekort.', 'Færdselsloven-Kørekort', 3000, 0, 'Moderate', 280, true),
('§ 6.8.2 Gentagen kørsel uden førerret', 'Gentagende kørsel uden gyldig kørekort, efter tidligere overtrædelser.', 'Færdselsloven-Kørekort', 7500, 0, 'Severe', 281, true),
('§ 6.8.3 Kørsel i uregistreret køretøj', 'Kørsel med et køretøj, der ikke er registreret i henhold til lovgivningen.', 'Færdselsloven-Kørekort', 4000, 0, 'Moderate', 282, true),
('§ 6.8.4 Uautoriseret brug af andres ejendom', 'Ulovlig brug af andres ejendom uden tilladelse.', 'Færdselsloven-Kørekort', 5000, 7200, 'Moderate', 283, true),
('§ 6.8.5 Brugstyveri af køretøj', 'Tyveri af et køretøj til midlertidig brug.', 'Færdselsloven-Kørekort', 7500, 14400, 'Severe', 284, true),
('§ 6.8.6 Tyveri af køretøj', 'Permanent tyveri af et køretøj.', 'Færdselsloven-Kørekort', 15000, 28800, 'Severe', 285, true),

-- Færdselsloven-Nummerplader
('§ 6.9.1 Ulovlig nummerpladeramme', 'Anvendelse af en nummerpladeramme, der ikke overholder lovgivningen.', 'Færdselsloven-Nummerplader', 1500, 0, 'Minor', 290, true),
('§ 6.9.2 Falske nummerplader', 'Brug af nummerplader, der ikke er udstedt til køretøjet.', 'Færdselsloven-Nummerplader', 5000, 7200, 'Severe', 291, true),
('§ 6.9.3 Manglende nummerplade', 'Kørsel uden synlig nummerplade på køretøjet.', 'Færdselsloven-Nummerplader', 3000, 0, 'Moderate', 292, true),
('§ 6.9.4 Tildækkede nummerplader', 'Nummerplader der er dækket til for at undgå identifikation.', 'Færdselsloven-Nummerplader', 4000, 0, 'Moderate', 293, true),

-- Færdselsloven-Hastighed
('§ 6.10.1 Hastighed 01-10 km/t over', 'Hastighedsovertrædelse 1-10 km/t over grænsen', 'Færdselsloven-Hastighed', 1500, 0, 'Minor', 300, true),
('§ 6.10.2 Hastighed 11-20 km/t over', 'Hastighedsovertrædelse 11-20 km/t over grænsen', 'Færdselsloven-Hastighed', 3000, 0, 'Minor', 301, true),
('§ 6.10.3 Hastighed 21-30 km/t over', 'Hastighedsovertrædelse 21-30 km/t over grænsen', 'Færdselsloven-Hastighed', 5000, 0, 'Minor', 302, true),
('§ 6.10.4 Hastighed 31-40 km/t over', 'Hastighedsovertrædelse 31-40 km/t over grænsen', 'Færdselsloven-Hastighed', 7500, 0, 'Moderate', 303, true),
('§ 6.10.5 Hastighed 41-50 km/t over', 'Hastighedsovertrædelse 41-50 km/t over grænsen', 'Færdselsloven-Hastighed', 10000, 0, 'Moderate', 304, true),
('§ 6.10.6 Hastighed 51-60 km/t over', 'Hastighedsovertrædelse 51-60 km/t over grænsen', 'Færdselsloven-Hastighed', 12000, 0, 'Moderate', 305, true),
('§ 6.10.7 Hastighed 61-70 km/t over', 'Hastighedsovertrædelse 61-70 km/t over grænsen', 'Færdselsloven-Hastighed', 15000, 0, 'Severe', 306, true),
('§ 6.10.8 Hastighed 71-80 km/t over', 'Hastighedsovertrædelse 71-80 km/t over grænsen', 'Færdselsloven-Hastighed', 20000, 0, 'Severe', 307, true),
('§ 6.10.9 Hastighed 81-90 km/t over', 'Hastighedsovertrædelse 81-90 km/t over grænsen', 'Færdselsloven-Hastighed', 25000, 0, 'Severe', 308, true),
('§ 6.10.10 Hastighed 91-100 km/t over', 'Hastighedsovertrædelse 91-100 km/t over grænsen', 'Færdselsloven-Hastighed', 30000, 0, 'Severe', 309, true),
('§ 6.10.11 Hastighed 101+ km/t over', 'Hastighedsovertrædelse 101+ km/t over grænsen', 'Færdselsloven-Hastighed', 40000, 0, 'Severe', 310, true),

-- Straffeloven-Våben
('§ 1.1.1 Ulovlig besiddelse af våben', 'Besiddelse af våben uden tilladelse.', 'Straffeloven-Våben', 5000, 14400, 'Severe', 100, true),
('§ 1.1.2 Ulovlig fremstilling af våben', 'Fremstilling af våben uden tilladelse.', 'Straffeloven-Våben', 10000, 28800, 'Severe', 101, true),
('§ 1.1.3 Ulovlig handel med våben', 'Salg eller distribution af våben uden tilladelse.', 'Straffeloven-Våben', 15000, 43200, 'Severe', 102, true),
('§ 1.1.4 Besiddelse af eksplosiver', 'Besiddelse af eksplosive materialer uden tilladelse.', 'Straffeloven-Våben', 20000, 57600, 'Severe', 103, true),
('§ 1.1.5 Brug af våben i forbrydelse', 'Anvendelse af våben under begåelse af en forbrydelse.', 'Straffeloven-Våben', 25000, 72000, 'Severe', 104, true),

-- Straffeloven-Narkotika
('§ 1.2.1 Besiddelse af narkotika (lille mængde)', 'Besiddelse af små mængder narkotika til eget forbrug.', 'Straffeloven-Narkotika', 3000, 7200, 'Moderate', 110, true),
('§ 1.2.2 Besiddelse af narkotika (stor mængde)', 'Besiddelse af større mængder narkotika.', 'Straffeloven-Narkotika', 10000, 28800, 'Severe', 111, true),
('§ 1.2.3 Salg af narkotika', 'Distribution eller salg af narkotika.', 'Straffeloven-Narkotika', 20000, 57600, 'Severe', 112, true),
('§ 1.2.4 Fremstilling af narkotika', 'Produktion af ulovlige stoffer.', 'Straffeloven-Narkotika', 30000, 86400, 'Severe', 113, true),
('§ 1.2.5 Narkotikahandel (organiseret)', 'Deltagelse i organiseret narkotikahandel.', 'Straffeloven-Narkotika', 50000, 129600, 'Severe', 114, true),

-- Straffeloven-Vold
('§ 1.3.1 Simpel vold', 'Fysisk overfald uden væsentlig skade.', 'Straffeloven-Vold', 5000, 14400, 'Moderate', 120, true),
('§ 1.3.2 Grov vold', 'Fysisk overfald med betydelig skade.', 'Straffeloven-Vold', 15000, 43200, 'Severe', 121, true),
('§ 1.3.3 Vold mod tjenestemand', 'Fysisk overfald på en offentlig embedsmand.', 'Straffeloven-Vold', 20000, 57600, 'Severe', 122, true),
('§ 1.3.4 Drabsforsøg', 'Forsøg på at dræbe en anden person.', 'Straffeloven-Vold', 50000, 172800, 'Severe', 123, true),
('§ 1.3.5 Drab', 'At dræbe en anden person.', 'Straffeloven-Vold', 100000, 259200, 'Severe', 124, true),

-- Straffeloven-Trusler
('§ 1.4.1 Trussel om vold', 'At true med fysisk vold.', 'Straffeloven-Trusler', 3000, 7200, 'Moderate', 130, true),
('§ 1.4.2 Trussel mod tjenestemand', 'At true en offentlig embedsmand.', 'Straffeloven-Trusler', 7500, 14400, 'Severe', 131, true),
('§ 1.4.3 Dødstrusler', 'At true med at dræbe.', 'Straffeloven-Trusler', 10000, 28800, 'Severe', 132, true),
('§ 1.4.4 Terroristiske trusler', 'Trusler der har til formål at skabe frygt i befolkningen.', 'Straffeloven-Trusler', 30000, 86400, 'Severe', 133, true),

-- Straffeloven-Tyveri
('§ 1.5.1 Butikstyveri', 'Tyveri fra en butik.', 'Straffeloven-Tyveri', 2000, 3600, 'Minor', 140, true),
('§ 1.5.2 Simpelt tyveri', 'Tyveri af ejendom af lav værdi.', 'Straffeloven-Tyveri', 5000, 7200, 'Moderate', 141, true),
('§ 1.5.3 Groft tyveri', 'Tyveri af ejendom af høj værdi.', 'Straffeloven-Tyveri', 15000, 28800, 'Severe', 142, true),
('§ 1.5.4 Indbrudstyveri', 'Tyveri ved indbrud i bygning.', 'Straffeloven-Tyveri', 20000, 43200, 'Severe', 143, true),
('§ 1.5.5 Røveri', 'Tyveri med brug af vold eller trusler.', 'Straffeloven-Tyveri', 30000, 72000, 'Severe', 144, true),
('§ 1.5.6 Væbnet røveri', 'Røveri med brug af våben.', 'Straffeloven-Tyveri', 50000, 115200, 'Severe', 145, true),

-- Straffeloven-Hæleri
('§ 1.6.1 Simpel hæleri', 'Modtagelse af stjålne varer.', 'Straffeloven-Hæleri', 5000, 7200, 'Moderate', 150, true),
('§ 1.6.2 Grov hæleri', 'Modtagelse af stjålne varer af høj værdi.', 'Straffeloven-Hæleri', 15000, 21600, 'Severe', 151, true),
('§ 1.6.3 Organiseret hæleri', 'Deltagelse i organiseret handel med stjålne varer.', 'Straffeloven-Hæleri', 30000, 43200, 'Severe', 152, true),

-- Straffeloven-Bedrageri
('§ 1.7.1 Simpelt bedrageri', 'Bedrageri af lav værdi.', 'Straffeloven-Bedrageri', 5000, 7200, 'Moderate', 160, true),
('§ 1.7.2 Groft bedrageri', 'Bedrageri af høj værdi.', 'Straffeloven-Bedrageri', 20000, 28800, 'Severe', 161, true),
('§ 1.7.3 Identitetstyveri', 'Ulovlig brug af andres identitet.', 'Straffeloven-Bedrageri', 15000, 21600, 'Severe', 162, true),
('§ 1.7.4 Dokumentfalsk', 'Forfalskning af dokumenter.', 'Straffeloven-Bedrageri', 10000, 14400, 'Severe', 163, true),

-- Straffeloven-Kidnapning
('§ 1.8.1 Frihedsberøvelse', 'Ulovlig tilbageholdelse af en person.', 'Straffeloven-Kidnapning', 15000, 43200, 'Severe', 170, true),
('§ 1.8.2 Kidnapning', 'Bortførelse af en person.', 'Straffeloven-Kidnapning', 30000, 86400, 'Severe', 171, true),
('§ 1.8.3 Kidnapning med løsepenge', 'Bortførelse med krav om løsepenge.', 'Straffeloven-Kidnapning', 50000, 129600, 'Severe', 172, true),
('§ 1.8.4 Gidseltagning', 'Tilbageholdelse af personer som gidsler.', 'Straffeloven-Kidnapning', 75000, 172800, 'Severe', 173, true),

-- Straffeloven-Offentlig orden
('§ 2.1.1 Forstyrrelse af offentlig orden', 'At skabe uro på offentlige steder.', 'Straffeloven-Offentlig orden', 1500, 0, 'Minor', 180, true),
('§ 2.1.2 Offentlig beruselse', 'At være synligt beruset på offentlige steder.', 'Straffeloven-Offentlig orden', 1000, 0, 'Minor', 181, true),
('§ 2.1.3 Husfredskrænkelse', 'Ulovlig indtrængen på privat ejendom.', 'Straffeloven-Offentlig orden', 3000, 3600, 'Minor', 182, true),
('§ 2.1.4 Blufærdighedskrænkelse', 'Uanstændig opførsel i offentligheden.', 'Straffeloven-Offentlig orden', 2000, 0, 'Minor', 183, true),
('§ 2.1.5 Hindring af politiarbejde', 'At forhindre politiet i at udføre deres arbejde.', 'Straffeloven-Offentlig orden', 5000, 7200, 'Moderate', 184, true),
('§ 2.1.6 Falsk anmeldelse', 'At indgive falsk anmeldelse til politiet.', 'Straffeloven-Offentlig orden', 7500, 14400, 'Severe', 185, true),

-- Straffeloven-Hærværk
('§ 2.2.1 Simpelt hærværk', 'Beskadigelse af ejendom af lav værdi.', 'Straffeloven-Hærværk', 3000, 3600, 'Minor', 190, true),
('§ 2.2.2 Groft hærværk', 'Beskadigelse af ejendom af høj værdi.', 'Straffeloven-Hærværk', 10000, 14400, 'Moderate', 191, true),
('§ 2.2.3 Brandstiftelse', 'Forsætlig antændelse af ejendom.', 'Straffeloven-Hærværk', 25000, 57600, 'Severe', 192, true),

-- Straffeloven-Bestikkelse
('§ 2.3.1 Bestikkelse af embedsmand', 'At bestikke en offentlig embedsmand.', 'Straffeloven-Bestikkelse', 20000, 28800, 'Severe', 193, true),
('§ 2.3.2 Modtagelse af bestikkelse', 'At modtage bestikkelse som embedsmand.', 'Straffeloven-Bestikkelse', 30000, 43200, 'Severe', 194, true);

-- =====================================================
-- END OF LAWS EXPORT
-- =====================================================

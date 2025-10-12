-- Delete all existing rules
DELETE FROM rules;

-- Insert new rules
-- Generelle Regler
INSERT INTO rules (title, description, category, order_index, is_active) VALUES
('Ingen diskrimination', 'Racisme, sexisme, homofobi og anden krænkende adfærd tolereres ikke, overholdes dette ikke vil det medfører konsekvenser.', 'Generelle Regler', 1, true),
('Ingen RDM/VDM', 'Random Deathmatch (RDM) og Vehicle Deathmatch (VDM) er forbudt uden gyldig RP-grund, vi skal alle sammen have det sjovt og hygge os med at rp, så det er ikke tilladt foruden et godt rp grundlag.', 'Generelle Regler', 2, true),
('Ingen exploit eller snyd', 'Brug af exploits, hacks eller snyd er forbudt.', 'Generelle Regler', 3, true),
('RP før alt', 'Al handling skal følge realistisk og sammenhængende rollespil.', 'Generelle Regler', 4, true),
('Ingen spam eller trolling', 'Spam, trolling og forstyrrende adfærd er ikke tilladt, vi skal alle sammen give hinanden rum til at være på serveren og til at have det sjovt og fordybe os i rp, overholdes dette ikke, kan det i værste fald medfører en straf', 'Generelle Regler', 5, true),
('CK/PK', 'Et ck/pk skal godkendes af staff, personen der bliver ck''et må ikke vidergive sine ting under nogle omstændigheder, der skal derudover også ansøges om et ck eller pk og det skal først godkendes før det er aktuelt, skriver man ingen puls i en me handling adskillige gange kan en læge godt ck dig!', 'Generelle Regler', 6, true),
('Respektér staff', 'Følg altid admins og moderators instruktioner. Diskuter ikke staff-beslutninger offentligt, vi er her for at give jer den bedste oplevelse og for at sørge for i får et behageligt ophold på serveren og sikre ro og orden på serveren.', 'Generelle Regler', 7, true),
('Forsøg på skade', 'Forsøg på Skade og dårlig omtale af serveren, kan medfører advarsler og i værste tilfælde perm ban', 'Generelle Regler', 8, true),
('Sund fornuft', 'Hvis noget ikke er beskrevet, forventes det, at man bruger sund fornuft og respekterer andre.', 'Generelle Regler', 9, true),
('Ansøgninger', 'Vis der spørges ind til ansøgninger er den automatisk afvist, i perioder kan de forskellige jobs modtage mange ansøgninger, og derfor er det ikke lige med det samme de bliver svaret på, de forskellige ansvarshavende for de forskellige jobs, skal nok gøre det så hurtigt de kan, men lad vær med at spørg ind til dem!', 'Generelle Regler', 10, true),
('Privat beskeder', 'Man skriver ikke privat til staff medmindre staff og spillere medmindre personen har sagt okay!', 'Generelle Regler', 11, true);

-- Discord Regler
INSERT INTO rules (title, description, category, order_index, is_active) VALUES
('Respektfuld kommunikation', 'Vis respekt for alle medlemmer. Hate speech og diskrimination er forbudt, discorden og serveren fungere som et frirum for spillerne og derfor skal vi ikke til at pege fingre af hinanden og være efter hinanden, det er spild af tid og det får man ikke noget ud af, vi skal alle have det sjovt sammen!', 'Discord Regler', 1, true),
('Ingen reklame', 'Reklame for andre servers eller produkter uden tilladelse er ikke tilladt, herunder bla at skærmdele fra andre servere på discord er forbudt, og kan i værste tilfælde blive straffet, hvis det sker gentagne gange!', 'Discord Regler', 2, true),
('Privatliv', 'Doxxing og deling af personlige oplysninger medfører øjeblikkelig ban, det er noget vi slår meget hårdt ned på, det skal bare ikke finde sted!', 'Discord Regler', 3, true),
('Ingen spam', 'Spam i tekst- og talechat er ikke tilladt, og kan i værste tilfælde medfører en udelukkelse/timeout', 'Discord Regler', 4, true);

-- RP Regler
INSERT INTO rules (title, description, category, order_index, is_active) VALUES
('Metagaming', 'Du må ikke bruge information udenfor RP til fordel i RP.', 'RP Regler', 1, true),
('Powergaming', 'Du må ikke tvinge andre til handlinger uden modspil.', 'RP Regler', 2, true),
('FailRP', 'Handlinger, der ikke giver mening i virkeligheden, er ikke tilladt.', 'RP Regler', 3, true),
('Ingen trolling i RP', 'Forstyrrende adfærd i RP er ikke tilladt.', 'RP Regler', 4, true),
('Respektér andre spillere', 'Vis respekt og samarbejd i RP.', 'RP Regler', 5, true),
('New Life Rule (NLR)', 'Efter død må du ikke vende tilbage til stedet, hvor du døde, eller interagere med hændelsen, før en rimelig tid er gået (typisk 5 minutter).', 'RP Regler', 6, true),
('No Combat Logging', 'Du må ikke logge af under en aktiv RP-konflikt eller kamp for at undgå konsekvenser.', 'RP Regler', 7, true),
('Respawn regler', 'Når du genopliver (respawner), skal du respektere NLR og fortsætte RP derfra.', 'RP Regler', 8, true),
('Looting', 'Du må gerne loote en betjent! dog er der et men, du må ikke tage våben dette indebærer riffler, flashbangs, pistoler, droner, tazer osv.', 'RP Regler', 9, true);

-- Semi-Content RP
INSERT INTO rules (title, description, category, order_index, is_active) VALUES
('Kørsel med kant', 'Semi-content RP tillader aggressiv kørsel og jagt, men altid inden for rimelighed og uden at ødelægge RP for andre.', 'Semi-Content RP', 1, true),
('Taktisk brug af køretøjer', 'Køretøjer kan bruges taktisk i jagter og konflikter, men må ikke misbruges til at crash eller spam.', 'Semi-Content RP', 2, true),
('Ingen unødvendig ødelæggelse', 'Skadesæt ikke unødigt køretøjer eller miljø uden RP-grund.', 'Semi-Content RP', 3, true),
('RP før vold', 'Selvom semi-content tillader mere vold, skal der altid være RP-opbygning før konfrontationer.', 'Semi-Content RP', 4, true);

-- Politi RP
INSERT INTO rules (title, description, category, order_index, is_active) VALUES
('Brug af magt', 'Våben og magt må kun bruges ved reel trussel i RP.', 'Politi RP', 1, true),
('Intern RP', 'Politi laver også RP udenfor missioner, fx briefinger.', 'Politi RP', 2, true),
('Flugt fra politiet', 'Lad nu vær med at stikke af fra politiet med mindre der er en rigtig god grund til det, det dræber rpen der kan komme ud af det.', 'Politi RP', 3, true);

-- EMS RP
INSERT INTO rules (title, description, category, order_index, is_active) VALUES
('Livreddende fokus', 'EMS skal fokusere på at redde liv og må ikke deltage i konflikter.', 'EMS RP', 1, true),
('Neutralitet', 'EMS må ikke tage parti i turf wars eller konflikter.', 'EMS RP', 2, true);

-- Turf Wars
INSERT INTO rules (title, description, category, order_index, is_active) VALUES
('Planlagt RP', 'Turf wars skal planlægges og godkendes af den bande-ansvarlige', 'Turf Wars', 1, true),
('RP før skydning', 'Dialog og eskalering skal ske før voldshandlinger.', 'Turf Wars', 2, true);

-- Bande RP
INSERT INTO rules (title, description, category, order_index, is_active) VALUES
('Politi og bande karakter', 'Det er tilladt at have en politi karakter og en bande karakter, dog skal det gøres klart, at man ikke må sidde i en ledende stilling i banden. Opdages det at man ikke kan skelne mellem politi og bande karakteren eller at man trods denne regel har en ledende stilling, vil det medfører ck af karakteren man har misligholdt regelen på uden varsel!', 'Bande RP', 1, true),
('RP før vold', 'Bandeaktivitet skal være fokuseret på RP og organisation, ikke kun vold.', 'Bande RP', 2, true);

-- Våben og Køretøjer
INSERT INTO rules (title, description, category, order_index, is_active) VALUES
('Ingen våbenmisbrug', 'Våben må kun bruges i legitime RP-situationer.', 'Våben og Køretøjer', 1, true);

-- RP Adfærd
INSERT INTO rules (title, description, category, order_index, is_active) VALUES
('FearRP', 'Du skal opføre dig realistisk bange for trusler og våben. Det er ikke tilladt at ignorere fare, som ville være urealistisk i virkeligheden.', 'RP Adfærd', 1, true),
('Område-respekt', 'Der findes ikke deciderede safe zones, men tænk dig om før du skyder ved hospital, politistation og lignende steder.', 'RP Adfærd', 2, true);

-- Karakterregler
INSERT INTO rules (title, description, category, order_index, is_active) VALUES
('Jobskifte', 'Du må ikke skifte job eller karakter for hurtigt uden en klar RP-begrundelse.', 'Karakterregler', 1, true),
('Flere karakterer', 'Du har mulighed for at lave to karakterer, ønskes der flere skal der ansøges om det, og ansøgningen skal først godkendes før det er aktuelt.', 'Karakterregler', 2, true);

-- Ejerskab
INSERT INTO rules (title, description, category, order_index, is_active) VALUES
('Ejendele og Tyveri', 'Alt tyveri og overdragelse af ejendele skal ske gennem RP.', 'Ejerskab', 1, true);

-- RP Straffe
INSERT INTO rules (title, description, category, order_index, is_active) VALUES
('Accepter RP konsekvenser', 'Spillere skal acceptere konsekvenser af deres RP handlinger, som fængsling eller straf.', 'RP Straffe', 1, true),
('Ingen Ghosting', 'Efter død eller fjernelse fra spillet må du ikke bruge information eller interagere i RP med ny karakter før rimelig tid er gået (NLR gælder).', 'RP Straffe', 2, true);

-- Job RP
INSERT INTO rules (title, description, category, order_index, is_active) VALUES
('Ansvarlighed', 'Politi og EMS må ikke misbruge deres rolle til personlig gevinst uden RP-grundlag.', 'Job RP', 1, true);

-- Event Regler
INSERT INTO rules (title, description, category, order_index, is_active) VALUES
('Godkendelse af events', 'Store RP events skal godkendes af admins på forhånd.', 'Event Regler', 1, true);

-- Sanktioner
INSERT INTO rules (title, description, category, order_index, is_active) VALUES
('Advarsler', 'Ved mindre overtrædelser gives advarsler.', 'Sanktioner', 1, true),
('Demotion', 'Job-relaterede overtrædelser kan medføre degradering eller tab af job.', 'Sanktioner', 2, true),
('Ban', 'Straffen er op til den pågældende staff om hvad din sanktion er', 'Sanktioner', 3, true);

-- Donationer
INSERT INTO rules (title, description, category, order_index, is_active) VALUES
('Donationer', 'Alle donationer via vores mobilepay boks kan ikke sendes tilbage! Du skal være min 16+ år for at donore er man under 16 år skal man have tilladelse fra forældre', 'Donationer', 1, true),
('Donation af scripts', 'Donores der script sendes disse scripts ikke tilbage! de vil forblive direkte på key! Dette gælder også tøj og biler der er donoret til os!', 'Donationer', 2, true);

-- Bande-ansvarlig
INSERT INTO rules (title, description, category, order_index, is_active) VALUES
('Bande-ansvarlig', 'På adventure har vi valgt at bringe bandemiljøet mere til livs, derfor har man en bande-ansvarlige der kan træffes ingame, det vil sige at den bande-ansvarlige er en karakter. Dette betyder at alt hvad der kan tages i rp, skal tages i rp, den bande-ansvarlige kommer til at komme med nogle hints om hvem personen er og hvor han befinder sig, hvad der sker herfra er op til rpen.', 'Bande-ansvarlig', 1, true);
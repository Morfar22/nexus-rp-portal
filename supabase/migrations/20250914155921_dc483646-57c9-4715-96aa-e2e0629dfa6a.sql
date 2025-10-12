-- Add comprehensive FiveM/RP laws to the laws table

-- Traffic Laws
INSERT INTO public.laws (title, description, category, fine_amount, jail_time_minutes, severity_level, order_index) VALUES
('Hastighedsoverskridelse', 'Kørsel over den tilladte hastighedsgrænse på offentlige veje', 'Trafik', 500, 0, 'Minor', 1),
('Kørsel uden kørekort', 'Betjening af motorkøretøj uden gyldigt kørekort', 'Trafik', 1000, 10, 'Moderate', 2),
('Spirituskørsel', 'Kørsel under påvirkning af alkohol eller rusmidler', 'Trafik', 2500, 30, 'Major', 3),
('Flugt fra politiet', 'At flygte fra politiet under en anholdelse eller kontrol', 'Trafik', 5000, 45, 'Major', 4),

-- Criminal Laws  
INSERT INTO public.laws (title, description, category, fine_amount, jail_time_minutes, severity_level, order_index) VALUES
('Simpel vold', 'Fysisk overfald på en anden person uden våben', 'Kriminalitet', 1500, 20, 'Moderate', 1),
('Tyveri', 'Ulovlig tilegnelse af andres ejendom', 'Kriminalitet', 1000, 15, 'Moderate', 2),
('Røveri', 'Tyveri ved brug af vold eller trusler', 'Kriminalitet', 3000, 60, 'Major', 3),
('Våbenbesiddelse', 'Ulovlig besiddelse af våben uden tilladelse', 'Kriminalitet', 2000, 30, 'Major', 4),
('Narkotikabesiddelse', 'Besiddelse af ulovlige rusmidler', 'Kriminalitet', 1500, 25, 'Moderate', 5),
('Narkohandel', 'Salg eller distribution af ulovlige rusmidler', 'Kriminalitet', 5000, 120, 'Critical', 6),

-- Public Order Laws
INSERT INTO public.laws (title, description, category, fine_amount, jail_time_minutes, severity_level, order_index) VALUES
('Forstyrrelse af ro og orden', 'Skabelse af unødig larm eller forstyrrelse på offentligt sted', 'Offentlig orden', 500, 5, 'Minor', 1),
('Hærværk', 'Ødelæggelse af offentlig eller privat ejendom', 'Offentlig orden', 1000, 15, 'Moderate', 2),
('Offentlig berruselse', 'At være synligt påvirket af alkohol på offentligt sted', 'Offentlig orden', 300, 10, 'Minor', 3),
('Ulovlig forsamling', 'Deltagelse i ulovlig demonstration eller forsamling', 'Offentlig orden', 800, 20, 'Moderate', 4),

-- Government Laws
INSERT INTO public.laws (title, description, category, fine_amount, jail_time_minutes, severity_level, order_index) VALUES
('Modstand mod arrestation', 'Aktivt at modstå en lovlig anholdelse', 'Statslige forbrydelser', 2000, 30, 'Major', 1),
('Angreb på embedsmand', 'Fysisk eller verbal vold mod politiembedsmand', 'Statslige forbrydelser', 3500, 45, 'Major', 2),
('Korruption', 'Bestikkelse eller korruption af offentlige embedsmænd', 'Statslige forbrydelser', 10000, 180, 'Critical', 3),
('Skatteunddragelse', 'Undgåelse af lovpligtige skatter og afgifter', 'Statslige forbrydelser', 5000, 60, 'Major', 4),

-- Business Laws  
INSERT INTO public.laws (title, description, category, fine_amount, jail_time_minutes, severity_level, order_index) VALUES
('Drift uden licens', 'Drift af forretning uden påkrævet licens', 'Erhverv', 2000, 0, 'Moderate', 1),
('Svindel', 'Bedrageri i forbindelse med forretningsaktiviteter', 'Erhverv', 3000, 45, 'Major', 2),
('Ulovlig konkurrence', 'Unfair forretningspraksis eller monopolisering', 'Erhverv', 1500, 0, 'Moderate', 3);
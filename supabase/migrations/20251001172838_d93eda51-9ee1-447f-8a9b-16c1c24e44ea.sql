-- Create donation tier packages following FiveM TOS
-- No custom ped models or pay-to-win features

INSERT INTO packages (name, description, price_amount, currency, interval, features, order_index, is_active)
VALUES
  (
    'Super Donator',
    'Den højeste donator tier med alle fordele',
    50000, -- 500 DKK
    'DKK',
    'month',
    jsonb_build_array(
      'Højeste prioritet i kø',
      '2 reserverede pladser på serveren',
      'Adgang til eksklusive køretøjer',
      'Tilpasset nummerplade',
      'Prioriteret support',
      'Eksklusive kosmetiske items',
      'In-game fordele og rabatter',
      'Særlig rolle i Discord'
    ),
    1,
    true
  ),
  (
    'Donator Tier 1',
    'Premium donator pakke med mange fordele',
    30000, -- 300 DKK
    'DKK',
    'month',
    jsonb_build_array(
      'Høj prioritet i kø',
      '1 reserveret plads på serveren',
      'Adgang til premium køretøjer',
      'Tilpassede køretøjsfarver',
      'Prioriteret support',
      'Premium kosmetiske items',
      'In-game rabatter',
      'Donator rolle i Discord'
    ),
    2,
    true
  ),
  (
    'Donator Tier 2',
    'Mellem donator pakke med gode fordele',
    20000, -- 200 DKK
    'DKK',
    'month',
    jsonb_build_array(
      'Medium prioritet i kø',
      'Adgang til specielle køretøjer',
      'Tilpassede køretøjsfarver',
      'Support prioritet',
      'Kosmetiske items',
      'In-game fordele',
      'Donator rolle i Discord'
    ),
    3,
    true
  ),
  (
    'Donator Tier 3',
    'Basis donator pakke med fordele',
    10000, -- 100 DKK
    'DKK',
    'month',
    jsonb_build_array(
      'Lav prioritet i kø',
      'Adgang til nogle køretøjer',
      'Basis kosmetiske muligheder',
      'In-game fordele',
      'Donator rolle i Discord'
    ),
    4,
    true
  ),
  (
    'Donator Tier 4',
    'Start donator pakke med basis fordele',
    5000, -- 50 DKK
    'DKK',
    'month',
    jsonb_build_array(
      'Kø prioritet',
      'Basis fordele',
      'Donator rolle i Discord'
    ),
    5,
    true
  );
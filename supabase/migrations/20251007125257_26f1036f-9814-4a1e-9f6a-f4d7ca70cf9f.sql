-- Create keybinds table
CREATE TABLE public.keybinds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT NOT NULL,
  key_code TEXT NOT NULL,
  action_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES custom_users(id)
);

-- Enable RLS
ALTER TABLE public.keybinds ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active keybinds"
  ON public.keybinds
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Staff can manage keybinds"
  ON public.keybinds
  FOR ALL
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

-- Create index for better query performance
CREATE INDEX idx_keybinds_category ON public.keybinds(category);
CREATE INDEX idx_keybinds_order ON public.keybinds(order_index);

-- Insert some default keybinds
INSERT INTO public.keybinds (key_name, key_code, action_name, description, category, order_index) VALUES
  ('E', 'KeyE', 'Interact', 'Interact with objects and NPCs', 'general', 1),
  ('F', 'KeyF', 'Enter Vehicle', 'Enter or exit vehicle', 'vehicle', 2),
  ('Tab', 'Tab', 'Inventory', 'Open your inventory', 'general', 3),
  ('M', 'KeyM', 'Map', 'Open the map', 'general', 4),
  ('T', 'KeyT', 'Chat', 'Open text chat', 'communication', 5),
  ('Y', 'KeyY', 'Voice Chat', 'Push to talk', 'communication', 6),
  ('X', 'KeyX', 'Hands Up', 'Raise your hands', 'emotes', 7),
  ('Z', 'KeyZ', 'Crouch', 'Crouch down', 'movement', 8),
  ('Left Shift', 'ShiftLeft', 'Sprint', 'Sprint while moving', 'movement', 9),
  ('Space', 'Space', 'Jump', 'Jump or climb', 'movement', 10);
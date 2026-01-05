-- Create user_stats table for tracking streaks
CREATE TABLE public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_log_date DATE,
  total_procedures INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_stats
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_stats
CREATE POLICY "Users can view their own stats"
  ON public.user_stats FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own stats"
  ON public.user_stats FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own stats"
  ON public.user_stats FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on badges (public read)
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges"
  ON public.badges FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage badges"
  ON public.badges FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create user_badges table for earned badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS on user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges"
  ON public.user_badges FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage all badges"
  ON public.user_badges FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at on user_stats
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default badges
INSERT INTO public.badges (name, icon, description) VALUES
  ('Early Bird', '🌅', 'Logged a case before 8 AM'),
  ('Century Club', '💯', 'Logged 100 total cases'),
  ('Department Master', '🏆', 'Completed 100% of a department quota'),
  ('Week Warrior', '🔥', 'Maintained a 7-day streak'),
  ('Month Master', '👑', 'Maintained a 30-day streak');

-- Function to update streaks and award badges
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_stat RECORD;
  today DATE := CURRENT_DATE;
BEGIN
  -- Get or create user stats
  SELECT * INTO user_stat FROM user_stats WHERE user_id = NEW.student_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_stats (user_id, current_streak, longest_streak, last_log_date, total_procedures)
    VALUES (NEW.student_id, 1, 1, today, 1);
  ELSE
    -- Update streak logic
    IF user_stat.last_log_date = today THEN
      -- Same day, just increment total
      UPDATE user_stats 
      SET total_procedures = total_procedures + 1
      WHERE user_id = NEW.student_id;
    ELSIF user_stat.last_log_date = today - INTERVAL '1 day' THEN
      -- Yesterday, increment streak
      UPDATE user_stats 
      SET 
        current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_log_date = today,
        total_procedures = total_procedures + 1
      WHERE user_id = NEW.student_id;
    ELSE
      -- Streak broken, reset to 1
      UPDATE user_stats 
      SET 
        current_streak = 1,
        last_log_date = today,
        total_procedures = total_procedures + 1
      WHERE user_id = NEW.student_id;
    END IF;
    
    -- Check for badges
    -- Century Club (100 cases)
    IF (SELECT total_procedures FROM user_stats WHERE user_id = NEW.student_id) >= 100 THEN
      INSERT INTO user_badges (user_id, badge_id)
      SELECT NEW.student_id, id FROM badges WHERE name = 'Century Club'
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    -- Week Warrior (7 day streak)
    IF (SELECT current_streak FROM user_stats WHERE user_id = NEW.student_id) >= 7 THEN
      INSERT INTO user_badges (user_id, badge_id)
      SELECT NEW.student_id, id FROM badges WHERE name = 'Week Warrior'
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    -- Month Master (30 day streak)
    IF (SELECT current_streak FROM user_stats WHERE user_id = NEW.student_id) >= 30 THEN
      INSERT INTO user_badges (user_id, badge_id)
      SELECT NEW.student_id, id FROM badges WHERE name = 'Month Master'
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    -- Early Bird (logged before 8 AM)
    IF EXTRACT(HOUR FROM NEW.created_at) < 8 THEN
      INSERT INTO user_badges (user_id, badge_id)
      SELECT NEW.student_id, id FROM badges WHERE name = 'Early Bird'
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update streaks on procedure insert
CREATE TRIGGER on_procedure_insert_update_streak
  AFTER INSERT ON public.procedures
  FOR EACH ROW
  WHEN (NEW.student_id IS NOT NULL)
  EXECUTE FUNCTION public.update_user_streak();

-- Enable realtime for procedures table
ALTER PUBLICATION supabase_realtime ADD TABLE public.procedures;
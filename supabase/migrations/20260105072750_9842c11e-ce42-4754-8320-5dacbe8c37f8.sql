-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  batch_id UUID NULL,
  recipient_id UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Instructors can insert messages
CREATE POLICY "Instructors can send messages"
ON public.messages
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'instructor'::app_role) AND sender_id = auth.uid());

-- Students can view messages sent to them or their batch
CREATE POLICY "Students can view their messages"
ON public.messages
FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role) AND (
    recipient_id = auth.uid() OR
    batch_id IN (SELECT batch_id FROM user_batches WHERE user_id = auth.uid())
  )
);

-- Instructors can view messages they sent
CREATE POLICY "Instructors can view their messages"
ON public.messages
FOR SELECT
USING (has_role(auth.uid(), 'instructor'::app_role) AND sender_id = auth.uid());

-- Admins can manage all messages
CREATE POLICY "Admins manage all messages"
ON public.messages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create message reactions table
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, reaction_type)
);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Students can add reactions to messages they can see
CREATE POLICY "Students can react to messages"
ON public.message_reactions
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'student'::app_role) AND 
  user_id = auth.uid() AND
  message_id IN (
    SELECT id FROM messages WHERE 
      recipient_id = auth.uid() OR 
      batch_id IN (SELECT batch_id FROM user_batches WHERE user_id = auth.uid())
  )
);

-- Users can view reactions on messages they can see
CREATE POLICY "Users can view reactions"
ON public.message_reactions
FOR SELECT
USING (
  message_id IN (
    SELECT id FROM messages WHERE 
      sender_id = auth.uid() OR
      recipient_id = auth.uid() OR
      batch_id IN (SELECT batch_id FROM user_batches WHERE user_id = auth.uid())
  )
);

-- Users can delete their own reactions
CREATE POLICY "Users can delete their reactions"
ON public.message_reactions
FOR DELETE
USING (user_id = auth.uid());

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  related_id UUID NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their notifications"
ON public.notifications
FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their notifications"
ON public.notifications
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- System can insert notifications (via functions)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create function to notify students when message is sent
CREATE OR REPLACE FUNCTION public.notify_message_recipients()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_record RECORD;
  sender_name TEXT;
BEGIN
  -- Get sender name
  SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
  
  -- If message is to specific student
  IF NEW.recipient_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, content, related_id)
    VALUES (
      NEW.recipient_id,
      'message',
      'New message from ' || COALESCE(sender_name, 'instructor'),
      LEFT(NEW.content, 100),
      NEW.id
    );
  END IF;
  
  -- If message is to batch
  IF NEW.batch_id IS NOT NULL THEN
    FOR recipient_record IN 
      SELECT user_id FROM user_batches WHERE batch_id = NEW.batch_id
    LOOP
      INSERT INTO notifications (user_id, type, title, content, related_id)
      VALUES (
        recipient_record.user_id,
        'message',
        'New batch message from ' || COALESCE(sender_name, 'instructor'),
        LEFT(NEW.content, 100),
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for message notifications
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_message_recipients();

-- Enable realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
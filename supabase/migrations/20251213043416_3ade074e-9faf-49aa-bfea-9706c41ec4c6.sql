-- Create departments table
CREATE TABLE public.departments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create quota_tasks table (replaces quota_targets)
CREATE TABLE public.quota_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  target integer NOT NULL DEFAULT 1,
  is_predefined boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(department_id, task_name)
);

-- Update procedures table to reference departments and tasks
ALTER TABLE public.procedures 
  ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN quota_task_id uuid REFERENCES public.quota_tasks(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for departments
CREATE POLICY "Public read/write departments" 
ON public.departments 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for quota_tasks
CREATE POLICY "Public read/write quota_tasks" 
ON public.quota_tasks 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Insert 8 departments
INSERT INTO public.departments (name) VALUES
  ('Oral Maxillofacial Surgery'),
  ('Oral Medicine and Radiology'),
  ('Periodontics'),
  ('Pediatric Dentistry'),
  ('Endodontics'),
  ('Prosthodontics'),
  ('Orthodontics'),
  ('Public Health Dentistry');

-- Insert predefined tasks for Endodontics (migration of existing data)
INSERT INTO public.quota_tasks (department_id, task_name, target, is_predefined)
SELECT 
  d.id,
  qt.procedure_type,
  qt.target,
  true
FROM public.quota_targets qt
CROSS JOIN public.departments d
WHERE d.name = 'Endodontics';

-- Migrate existing procedures to Endodontics department
UPDATE public.procedures p
SET 
  department_id = d.id,
  quota_task_id = qt.id
FROM public.departments d
JOIN public.quota_tasks qt ON qt.department_id = d.id
WHERE d.name = 'Endodontics' 
  AND qt.task_name = p.procedure_type;

-- Add common predefined tasks for Oral Maxillofacial Surgery
INSERT INTO public.quota_tasks (department_id, task_name, target, is_predefined)
SELECT d.id, 'Simple Extractions', 10, true
FROM public.departments d
WHERE d.name = 'Oral Maxillofacial Surgery';

INSERT INTO public.quota_tasks (department_id, task_name, target, is_predefined)
SELECT d.id, 'Surgical Extractions', 10, true
FROM public.departments d
WHERE d.name = 'Oral Maxillofacial Surgery';

INSERT INTO public.quota_tasks (department_id, task_name, target, is_predefined)
SELECT d.id, 'Impactions', 10, true
FROM public.departments d
WHERE d.name = 'Oral Maxillofacial Surgery';

-- Add common predefined tasks for Oral Medicine and Radiology
INSERT INTO public.quota_tasks (department_id, task_name, target, is_predefined)
SELECT d.id, 'OPG Interpretations', 10, true
FROM public.departments d
WHERE d.name = 'Oral Medicine and Radiology';

INSERT INTO public.quota_tasks (department_id, task_name, target, is_predefined)
SELECT d.id, 'Biopsies', 10, true
FROM public.departments d
WHERE d.name = 'Oral Medicine and Radiology';

-- Add common predefined tasks for Periodontics
INSERT INTO public.quota_tasks (department_id, task_name, target, is_predefined)
SELECT d.id, 'Scaling', 10, true
FROM public.departments d
WHERE d.name = 'Periodontics';

INSERT INTO public.quota_tasks (department_id, task_name, target, is_predefined)
SELECT d.id, 'Root Planning', 10, true
FROM public.departments d
WHERE d.name = 'Periodontics';

INSERT INTO public.quota_tasks (department_id, task_name, target, is_predefined)
SELECT d.id, 'Flap Surgery', 10, true
FROM public.departments d
WHERE d.name = 'Periodontics';

-- Add common predefined tasks for Pediatric Dentistry
INSERT INTO public.quota_tasks (department_id, task_name, target, is_predefined)
SELECT d.id, 'Pulpectomy', 10, true
FROM public.departments d
WHERE d.name = 'Pediatric Dentistry';

INSERT INTO public.quota_tasks (department_id, task_name, target, is_predefined)
SELECT d.id, 'Stainless Steel Crowns', 10, true
FROM public.departments d
WHERE d.name = 'Pediatric Dentistry';

-- Add common predefined tasks for Prosthodontics
INSERT INTO public.quota_tasks (department_id, task_name, target, is_predefined)
SELECT d.id, 'Complete Dentures', 10, true
FROM public.departments d
WHERE d.name = 'Prosthodontics';

INSERT INTO public.quota_tasks (department_id, task_name, target, is_predefined)
SELECT d.id, 'Partial Dentures', 10, true
FROM public.departments d
WHERE d.name = 'Prosthodontics';

INSERT INTO public.quota_tasks (department_id, task_name, target, is_predefined)
SELECT d.id, 'Crowns', 10, true
FROM public.departments d
WHERE d.name = 'Prosthodontics';

-- Add common predefined tasks for Orthodontics
INSERT INTO public.quota_tasks (department_id, task_name, target, is_predefined)
SELECT d.id, 'Fixed Appliances', 10, true
FROM public.departments d
WHERE d.name = 'Orthodontics';

INSERT INTO public.quota_tasks (department_id, task_name, target, is_predefined)
SELECT d.id, 'Removable Appliances', 10, true
FROM public.departments d
WHERE d.name = 'Orthodontics';

-- Add common predefined tasks for Public Health Dentistry
INSERT INTO public.quota_tasks (department_id, task_name, target, is_predefined)
SELECT d.id, 'Community Surveys', 10, true
FROM public.departments d
WHERE d.name = 'Public Health Dentistry';

INSERT INTO public.quota_tasks (department_id, task_name, target, is_predefined)
SELECT d.id, 'Health Education Sessions', 10, true
FROM public.departments d
WHERE d.name = 'Public Health Dentistry';
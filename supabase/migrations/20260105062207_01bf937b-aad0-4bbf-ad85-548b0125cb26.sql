-- Function 1: Get student vs batch stats (average per department for a batch)
CREATE OR REPLACE FUNCTION public.get_student_vs_batch_stats(student_batch text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  WITH student_procedure_counts AS (
    SELECT 
      d.id as department_id,
      d.name as department_name,
      p.student_id,
      COUNT(*) as proc_count
    FROM procedures p
    INNER JOIN user_batches ub ON p.student_id = ub.user_id
    INNER JOIN batches b ON ub.batch_id = b.id
    INNER JOIN departments d ON p.department_id = d.id
    WHERE p.status = 'verified'
      AND b.name = student_batch
    GROUP BY d.id, d.name, p.student_id
  ),
  department_averages AS (
    SELECT
      d.id,
      d.name as department,
      COALESCE(ROUND(AVG(spc.proc_count)::numeric, 2), 0) as batch_avg
    FROM departments d
    LEFT JOIN student_procedure_counts spc ON d.id = spc.department_id
    GROUP BY d.id, d.name
  )
  SELECT json_agg(
    json_build_object(
      'department', department,
      'batch_avg', batch_avg
    ) ORDER BY department
  ) INTO result
  FROM department_averages;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Function 2: Get batch comparison stats (total completed per batch)
CREATE OR REPLACE FUNCTION public.get_batch_comparison_stats()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'batch', b.name,
      'total', COALESCE(COUNT(p.id), 0)
    ) ORDER BY b.name
  ) INTO result
  FROM batches b
  LEFT JOIN user_batches ub ON b.id = ub.batch_id
  LEFT JOIN procedures p ON ub.user_id = p.student_id AND p.status = 'verified'
  GROUP BY b.id, b.name;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_student_vs_batch_stats(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_batch_comparison_stats() TO authenticated;
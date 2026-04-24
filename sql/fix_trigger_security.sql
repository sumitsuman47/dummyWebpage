-- =============================================
-- ALTERNATIVE FIX: Make Trigger Security Definer
-- =============================================
-- This allows the trigger to bypass RLS policies

-- Recreate the audit trigger function as SECURITY DEFINER
CREATE OR REPLACE FUNCTION log_feature_flag_change()
RETURNS TRIGGER 
SECURITY DEFINER  -- This makes it run with creator's privileges, bypassing RLS
SET search_path = public
AS $$
BEGIN
  -- Only log if is_enabled changed
  IF (TG_OP = 'UPDATE' AND OLD.is_enabled IS DISTINCT FROM NEW.is_enabled) THEN
    INSERT INTO feature_flag_audit (
      feature_key,
      action,
      previous_state,
      new_state,
      changed_by,
      reason
    ) VALUES (
      NEW.feature_key,
      CASE WHEN NEW.is_enabled THEN 'enabled' ELSE 'disabled' END,
      jsonb_build_object('is_enabled', OLD.is_enabled, 'updated_at', OLD.updated_at),
      jsonb_build_object('is_enabled', NEW.is_enabled, 'updated_at', NEW.updated_at),
      NEW.updated_by,
      'Feature flag toggled'
    );
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO feature_flag_audit (
      feature_key,
      action,
      new_state,
      changed_by,
      reason
    ) VALUES (
      NEW.feature_key,
      'created',
      jsonb_build_object('is_enabled', NEW.is_enabled, 'created_at', NEW.created_at),
      NEW.updated_by,
      'Feature flag created'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS feature_flag_audit_trigger ON feature_flags;
CREATE TRIGGER feature_flag_audit_trigger
AFTER INSERT OR UPDATE ON feature_flags
FOR EACH ROW
EXECUTE FUNCTION log_feature_flag_change();

-- Now test it
SELECT 'Setup complete! Trigger will now bypass RLS policies.' as status;

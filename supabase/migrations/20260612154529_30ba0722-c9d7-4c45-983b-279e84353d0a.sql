
DROP TRIGGER IF EXISTS recompute_completeness_on_profile ON public.profiles;
CREATE TRIGGER recompute_completeness_on_profile
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
WHEN (pg_trigger_depth() = 0)
EXECUTE FUNCTION public.trg_recompute_completeness_profiles();

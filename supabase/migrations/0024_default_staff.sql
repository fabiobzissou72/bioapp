-- Existing biosites with services but no staff can't set weekly hours, since
-- availability is keyed off staff_id. Give every staff-less biosite a default
-- "Profissional" row (owners can rename or add more later).
insert into public.staff (biosite_id, name)
select b.id, 'Profissional'
from public.biosites b
where not exists (select 1 from public.staff s where s.biosite_id = b.id);

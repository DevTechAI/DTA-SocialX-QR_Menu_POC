-- Table 1: Events table
CREATE TABLE IF NOT EXISTS public.floor_events (
    event_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    event_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    event_organiser_name TEXT NOT NULL,
    event_organiser_ph TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT timezone('utc'::text, now())
) TABLESPACE pg_default;

-- Table 2: Event attendees/check-ins table
CREATE TABLE IF NOT EXISTS public.event_attendees (
    event_uuid UUID NOT NULL,
    attendee_phno TEXT NOT NULL,
    attendee_name TEXT NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT event_attendees_pkey PRIMARY KEY (event_uuid, attendee_phno),
    CONSTRAINT event_attendees_event_uuid_fkey FOREIGN KEY (event_uuid) 
        REFERENCES public.floor_events(event_uuid) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_uuid ON public.event_attendees(event_uuid);
CREATE INDEX IF NOT EXISTS idx_event_attendees_phno ON public.event_attendees(attendee_phno);
CREATE INDEX IF NOT EXISTS idx_floor_events_datetime ON public.floor_events(event_datetime);

-- RLS Policies (if needed)
ALTER TABLE public.floor_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Policy to allow public read access to events
CREATE POLICY "Allow public read access to events" ON public.floor_events
    FOR SELECT USING (true);

-- Policy to allow public insert access to event_attendees
CREATE POLICY "Allow public insert access to event_attendees" ON public.event_attendees
    FOR INSERT WITH CHECK (true);

-- Policy to allow public update access to event_attendees (for duplicate check-ins)
CREATE POLICY "Allow public update access to event_attendees" ON public.event_attendees
    FOR UPDATE USING (true);

-- Policy to allow public read access to event_attendees
CREATE POLICY "Allow public read access to event_attendees" ON public.event_attendees
    FOR SELECT USING (true);

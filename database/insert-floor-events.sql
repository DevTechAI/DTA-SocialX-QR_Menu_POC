-- Insert events into floor_events table
-- Organizer: Nithin
-- Note: Update event_organiser_ph with the actual phone number (currently placeholder: +919876543210)
-- Note: Update event_datetime with actual event dates/times (currently set to future dates)

INSERT INTO public.floor_events (event_uuid, event_name, event_datetime, event_organiser_name, event_organiser_ph) VALUES
('a1b2c3d4-e5f6-4789-a012-345678901234', 'Snooker Workshop', '2024-12-20 18:00:00+00', 'Nithin', '+919876543210'),
('b2c3d4e5-f6a7-4890-b123-456789012345', 'Coffee Tasting Workshop', '2024-12-21 15:00:00+00', 'Nithin', '+919876543210'),
('c3d4e5f6-a7b8-4901-c234-567890123456', 'Open Mic/Standup', '2024-12-22 19:00:00+00', 'Nithin', '+919876543210'),
('d4e5f6a7-b8c9-4012-d345-678901234567', 'Book Reading Session', '2024-12-23 16:00:00+00', 'Nithin', '+919876543210'),
('e5f6a7b8-c9d0-4123-e456-789012345678', 'Mandala Art', '2024-12-24 14:00:00+00', 'Nithin', '+919876543210'),
('f6a7b8c9-d0e1-4234-f567-890123456789', 'Tissue Texture Art', '2024-12-25 15:00:00+00', 'Nithin', '+919876543210'),
('a7b8c9d0-e1f2-4345-a678-901234567890', 'Clay Keychains', '2024-12-26 16:00:00+00', 'Nithin', '+919876543210'),
('b8c9d0e1-f2a3-4456-b789-012345678901', 'Clay Charms', '2024-12-27 14:00:00+00', 'Nithin', '+919876543210'),
('c9d0e1f2-a3b4-4567-c890-123456789012', 'Resin Art', '2024-12-28 15:00:00+00', 'Nithin', '+919876543210'),
('d0e1f2a3-b4c5-4678-d901-234567890123', 'Trinket Tray', '2024-12-29 16:00:00+00', 'Nithin', '+919876543210'),
('e1f2a3b4-c5d6-4789-e012-345678901234', 'Clay Coasters', '2024-12-30 14:00:00+00', 'Nithin', '+919876543210'),
('f2a3b4c5-d6e7-4890-f123-456789012345', 'Lippan Art', '2024-12-31 15:00:00+00', 'Nithin', '+919876543210'),
('a3b4c5d6-e7f8-4901-a234-567890123456', 'Pichwai Painting', '2025-01-01 16:00:00+00', 'Nithin', '+919876543210'),
('b4c5d6e7-f8a9-4012-b345-678901234567', 'Kerala Mural', '2025-01-02 14:00:00+00', 'Nithin', '+919876543210'),
('c5d6e7f8-a9b0-4123-c456-789012345678', 'Vision Board Workshop', '2025-01-03 15:00:00+00', 'Nithin', '+919876543210');

-- UUIDs Reference List:
-- 1. Snooker Workshop: a1b2c3d4-e5f6-4789-a012-345678901234
-- 2. Coffee Tasting Workshop: b2c3d4e5-f6a7-4890-b123-456789012345
-- 3. Open Mic/Standup: c3d4e5f6-a7b8-4901-c234-567890123456
-- 4. Book Reading Session: d4e5f6a7-b8c9-4012-d345-678901234567
-- 5. Mandala Art: e5f6a7b8-c9d0-4123-e456-789012345678
-- 6. Tissue Texture Art: f6a7b8c9-d0e1-4234-f567-890123456789
-- 7. Clay Keychains: a7b8c9d0-e1f2-4345-a678-901234567890
-- 8. Clay Charms: b8c9d0e1-f2a3-4456-b789-012345678901
-- 9. Resin Art: c9d0e1f2-a3b4-4567-c890-123456789012
-- 10. Trinket Tray: d0e1f2a3-b4c5-4678-d901-234567890123
-- 11. Clay Coasters: e1f2a3b4-c5d6-4789-e012-345678901234
-- 12. Lippan Art: f2a3b4c5-d6e7-4890-f123-456789012345
-- 13. Pichwai Painting: a3b4c5d6-e7f8-4901-a234-567890123456
-- 14. Kerala Mural: b4c5d6e7-f8a9-4012-b345-678901234567
-- 15. Vision Board Workshop: c5d6e7f8-a9b0-4123-c456-789012345678

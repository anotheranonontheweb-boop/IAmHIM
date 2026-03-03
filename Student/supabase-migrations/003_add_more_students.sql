-- Migration: Add more students with different sections
-- Run this in Supabase SQL Editor

-- Add more students to different sections
INSERT INTO users (name, email, password, grade, avatar, enrolled_date, role, section_id) VALUES
    ('Emma Watson', 'emma@example.com', 'password', '10-A', '👩‍🎓', NOW(), 'student', '10-A'),
    ('James Rodriguez', 'james@example.com', 'password', '10-A', '👨‍🎓', NOW(), 'student', '10-A'),
    ('Sophia Lee', 'sophia@example.com', 'password', '10-B', '👩‍🎓', NOW(), 'student', '10-B'),
    ('Liam Garcia', 'liam@example.com', 'password', '10-B', '👨‍🎓', NOW(), 'student', '10-B'),
    ('Olivia Martinez', 'olivia@example.com', 'password', '11-A', '👩‍🎓', NOW(), 'student', '11-A'),
    ('Noah Kim', 'noah@example.com', 'password', '11-A', '👨‍🎓', NOW(), 'student', '11-A'),
    ('Ava Thompson', 'ava@example.com', 'password', '10-A', '👩‍🎓', NOW(), 'student', '10-A'),
    ('Ethan Davis', 'ethan@example.com', 'password', '10-B', '👨‍🎓', NOW(), 'student', '10-B'),
    ('Isabella Wilson', 'isabella@example.com', 'password', '11-A', '👩‍🎓', NOW(), 'student', '11-A'),
    ('Mason Brown', 'mason@example.com', 'password', '10-A', '👨‍🎓', NOW(), 'student', '10-A')
ON CONFLICT DO NOTHING;

-- Add stats for new students
INSERT INTO user_stats (user_id, streak, points, total_points, class_rank, total_rank) VALUES
    (4, 10, 280, 1000, 2, 12),
    (5, 8, 220, 850, 3, 18),
    (6, 5, 150, 600, 1, 25),
    (7, 12, 350, 1200, 1, 10),
    (8, 7, 200, 750, 2, 20),
    (9, 3, 100, 400, 4, 30),
    (10, 6, 180, 700, 3, 22),
    (11, 9, 260, 900, 2, 15),
    (12, 4, 130, 550, 5, 28),
    (13, 11, 320, 1100, 1, 8)
ON CONFLICT DO NOTHING;

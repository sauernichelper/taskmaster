-- Seed-Daten für TaskMaster
-- Fügt Test-Tasks und Subtasks ein

INSERT INTO "Task" ("id", "title", "description", "completed", "createdAt", "updatedAt", "pdfPath") VALUES
('task1', 'React lernen', 'Hooks und Components verstehen', 0, '2025-04-21T10:00:00.000Z', '2025-04-21T10:00:00.000Z', NULL),
('task2', 'Projekt deployen', 'TaskMaster auf Vercel bringen', 0, '2025-04-21T11:00:00.000Z', '2025-04-21T11:00:00.000Z', NULL),
('task3', 'Prisma einrichten', 'Database Schema erstellen', 1, '2025-04-20T09:00:00.000Z', '2025-04-21T12:00:00.000Z', NULL);

INSERT INTO "Subtask" ("id", "title", "completed", "createdAt", "updatedAt", "taskId") VALUES
('sub1', 'useState verstehen', 1, '2025-04-21T10:00:00.000Z', '2025-04-21T10:00:00.000Z', 'task1'),
('sub2', 'useEffect lernen', 0, '2025-04-21T10:00:00.000Z', '2025-04-21T10:00:00.000Z', 'task1'),
('sub3', 'useContext probieren', 0, '2025-04-21T10:00:00.000Z', '2025-04-21T10:00:00.000Z', 'task1'),
('sub4', 'Vercel Account erstellen', 0, '2025-04-21T11:00:00.000Z', '2025-04-21T11:00:00.000Z', 'task2'),
('sub5', 'GitHub Repo verbinden', 0, '2025-04-21T11:00:00.000Z', '2025-04-21T11:00:00.000Z', 'task2'),
('sub6', 'Schema definieren', 1, '2025-04-20T09:00:00.000Z', '2025-04-21T12:00:00.000Z', 'task3'),
('sub7', 'Migration ausführen', 1, '2025-04-20T09:00:00.000Z', '2025-04-21T12:00:00.000Z', 'task3');

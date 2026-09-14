-- ============================================================================
-- PROVENTO SEED DATA FIXTURES
-- ============================================================================

-- Note: In real Supabase, users are created via auth.users first.
-- This script provides reference fixtures for local testing and seeding.

-- 1. Example Project insertion test snippet
-- (Assuming company id and user id are available)
/*
INSERT INTO public.companies (id, name, website, description, industry, company_size, location, verified)
VALUES (
    'a1111111-1111-1111-1111-111111111111',
    'Acme Logistics Tech',
    'https://acmelogistics.example.com',
    'Modern supply chain software for quick-commerce in India.',
    'Logistics / B2B SaaS',
    '25-50 employees',
    'Bengaluru, Karnataka',
    true
) ON CONFLICT DO NOTHING;

INSERT INTO public.projects (
    id,
    company_id,
    title,
    slug,
    description,
    problem_statement,
    context,
    requirements,
    deliverables,
    acceptance_criteria,
    evaluation_criteria,
    expected_hours,
    payment_amount,
    currency,
    application_deadline,
    project_deadline,
    status
) VALUES (
    'b2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'Build a REST API for a small inventory management system',
    'rest-api-inventory-management-system',
    'Develop a clean, well-tested Node.js + PostgreSQL REST API to manage warehouse items and inventory stock levels.',
    'Our operations team currently tracks incoming stock across 3 regional hubs with disjointed spreadsheets, resulting in stock-out discrepancies.',
    'We are hiring a Junior Backend Engineer to help scale our warehousing services. We want to see how you structure relational data and write reliable endpoints.',
    ARRAY['Node.js (TypeScript or modern ES)', 'PostgreSQL', 'RESTful API conventions', 'JWT or Bearer Token Authentication', 'Automated integration tests with Jest or Vitest'],
    ARRAY['Working backend repository', 'Database migration/schema scripts', 'Postman or OpenAPI spec', 'Passing test suite', 'Comprehensive README with setup instructions'],
    ARRAY['Required inventory CRUD endpoints work as specified', 'JWT Authentication secures private routes', 'Database is properly normalized with foreign keys', 'Automated tests pass with >= 75% coverage on business logic', 'README allows one-command Docker or local setup'],
    ARRAY['Code modularity and architecture', 'Database schema cleanliness', 'Error handling and HTTP status code precision', 'Documentation quality and readability', 'Adherence to deadlines'],
    8,
    5000.00,
    'INR',
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '8 days',
    'applications_open'
) ON CONFLICT DO NOTHING;

INSERT INTO public.project_skills (project_id, skill_name, is_required)
VALUES 
    ('b2222222-2222-2222-2222-222222222222', 'Node.js', true),
    ('b2222222-2222-2222-2222-222222222222', 'PostgreSQL', true),
    ('b2222222-2222-2222-2222-222222222222', 'REST APIs', true),
    ('b2222222-2222-2222-2222-222222222222', 'TypeScript', false);
*/

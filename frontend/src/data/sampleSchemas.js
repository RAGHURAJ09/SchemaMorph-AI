/**
 * Sample schemas inspired by public API data models.
 * Used in the "Try a Demo Schema" quick-load feature on the Upload page.
 *
 * Sources:
 *  - JSONPlaceholder   https://jsonplaceholder.typicode.com  (no auth)
 *  - Studio Ghibli API https://ghibliapi.herokuapp.com       (no auth)
 *  - Open Library API  https://openlibrary.org/developers    (no auth)
 */

export const DEMO_SCHEMAS = [
  {
    id: 'jsonplaceholder',
    label: 'JSONPlaceholder — Social Platform',
    emoji: '💬',
    description: '6 tables modeled on the JSONPlaceholder REST API: users, posts, comments, albums, photos, todos.',
    schema: `-- Schema inspired by JSONPlaceholder API (https://jsonplaceholder.typicode.com)
-- Classic social/blogging relational model — great for microservice decomposition demos.

CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    username    VARCHAR(50)   NOT NULL UNIQUE,
    email       VARCHAR(255)  NOT NULL UNIQUE,
    phone       VARCHAR(30),
    website     VARCHAR(255),
    company_name        VARCHAR(150),
    company_catch_phrase TEXT,
    address_street  VARCHAR(150),
    address_city    VARCHAR(100),
    address_zipcode VARCHAR(20),
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE posts (
    id      SERIAL PRIMARY KEY,
    user_id INTEGER       NOT NULL,
    title   VARCHAR(255)  NOT NULL,
    body    TEXT          NOT NULL,
    created_at TIMESTAMP  DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE comments (
    id      SERIAL PRIMARY KEY,
    post_id INTEGER      NOT NULL,
    name    VARCHAR(255) NOT NULL,
    email   VARCHAR(255) NOT NULL,
    body    TEXT         NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE albums (
    id      SERIAL PRIMARY KEY,
    user_id INTEGER      NOT NULL,
    title   VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE photos (
    id           SERIAL PRIMARY KEY,
    album_id     INTEGER      NOT NULL,
    title        VARCHAR(255) NOT NULL,
    url          TEXT         NOT NULL,
    thumbnail_url TEXT        NOT NULL,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

CREATE TABLE todos (
    id        SERIAL  PRIMARY KEY,
    user_id   INTEGER NOT NULL,
    title     VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    due_date  DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`,
    sampleQueries: `-- Find all posts and their comment counts per user
SELECT u.name, p.title, COUNT(c.id) AS comment_count
FROM users u
JOIN posts p ON p.user_id = u.id
LEFT JOIN comments c ON c.post_id = p.id
GROUP BY u.name, p.title
ORDER BY comment_count DESC;

-- Get all albums and their photo count for a user
SELECT u.username, a.title, COUNT(ph.id) AS photo_count
FROM users u
JOIN albums a ON a.user_id = u.id
LEFT JOIN photos ph ON ph.album_id = a.id
WHERE u.id = 1
GROUP BY u.username, a.title;

-- Get incomplete todos with user info
SELECT u.name, u.email, t.title AS task, t.due_date
FROM todos t
JOIN users u ON t.user_id = u.id
WHERE t.completed = FALSE
ORDER BY t.due_date;`
  },

  {
    id: 'ghibli',
    label: 'Studio Ghibli — Film Database',
    emoji: '🎬',
    description: '7 tables modeled on the Studio Ghibli REST API: films, characters, species, locations, vehicles, directors, producers.',
    schema: `-- Schema inspired by Studio Ghibli API (https://ghibliapi.herokuapp.com)
-- Rich entertainment domain with many-to-many relationships — excellent for boundary detection.

CREATE TABLE directors (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    birth_year INTEGER,
    nationality VARCHAR(50)
);

CREATE TABLE producers (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE films (
    id               SERIAL PRIMARY KEY,
    title            VARCHAR(255)   NOT NULL,
    original_title   VARCHAR(255),
    description      TEXT,
    director_id      INTEGER        NOT NULL,
    producer_id      INTEGER        NOT NULL,
    release_year     SMALLINT       NOT NULL,
    running_time     SMALLINT,
    rt_score         SMALLINT,
    created_at       TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (director_id) REFERENCES directors(id),
    FOREIGN KEY (producer_id) REFERENCES producers(id)
);

CREATE TABLE species (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    classification  VARCHAR(100),
    eye_colors      VARCHAR(255),
    hair_colors     VARCHAR(255)
);

CREATE TABLE characters (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(150)  NOT NULL,
    gender     VARCHAR(30),
    age        VARCHAR(20),
    eye_color  VARCHAR(50),
    hair_color VARCHAR(50),
    species_id INTEGER,
    FOREIGN KEY (species_id) REFERENCES species(id)
);

CREATE TABLE film_characters (
    film_id      INTEGER NOT NULL,
    character_id INTEGER NOT NULL,
    PRIMARY KEY (film_id, character_id),
    FOREIGN KEY (film_id)      REFERENCES films(id)      ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE locations (
    id          SERIAL PRIMARY KEY,
    film_id     INTEGER      NOT NULL,
    name        VARCHAR(150) NOT NULL,
    climate     VARCHAR(100),
    terrain     VARCHAR(100),
    surface_water SMALLINT,
    FOREIGN KEY (film_id) REFERENCES films(id) ON DELETE CASCADE
);

CREATE TABLE vehicles (
    id          SERIAL PRIMARY KEY,
    film_id     INTEGER      NOT NULL,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    vehicle_class VARCHAR(100),
    length      VARCHAR(50),
    pilot_id    INTEGER,
    FOREIGN KEY (film_id)  REFERENCES films(id)      ON DELETE CASCADE,
    FOREIGN KEY (pilot_id) REFERENCES characters(id)
);`,
    sampleQueries: `-- Find all characters per film with their species
SELECT f.title, c.name AS character, s.name AS species
FROM films f
JOIN film_characters fc ON fc.film_id = f.id
JOIN characters c ON c.id = fc.character_id
LEFT JOIN species s ON s.id = c.species_id
WHERE f.release_year > 1990
ORDER BY f.title, c.name;

-- Films with their directors, producers and average RT score
SELECT f.title, d.name AS director, p.name AS producer, f.rt_score
FROM films f
JOIN directors d ON f.director_id = d.id
JOIN producers p ON f.producer_id = p.id
ORDER BY f.rt_score DESC;

-- Count vehicles per film and who pilots them
SELECT f.title, v.name AS vehicle, c.name AS pilot
FROM vehicles v
JOIN films f ON v.film_id = f.id
LEFT JOIN characters c ON v.pilot_id = c.id
ORDER BY f.title;`
  },

  {
    id: 'openlibrary',
    label: 'Open Library — Book Catalog',
    emoji: '📚',
    description: '7 tables modeled on the Open Library API: books, authors, editions, publishers, subjects, book_authors, book_subjects.',
    schema: `-- Schema inspired by Open Library API (https://openlibrary.org/developers)
-- Library catalog domain with complex many-to-many relationships — ideal for decomposition.

CREATE TABLE authors (
    id            SERIAL PRIMARY KEY,
    olid          VARCHAR(20)  UNIQUE,  -- Open Library ID e.g. OL23919A
    name          VARCHAR(255) NOT NULL,
    birth_date    DATE,
    death_date    DATE,
    bio           TEXT,
    wikipedia_url TEXT,
    photo_url     TEXT
);

CREATE TABLE publishers (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(255) NOT NULL UNIQUE,
    country VARCHAR(100),
    website TEXT
);

CREATE TABLE subjects (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE works (
    id           SERIAL PRIMARY KEY,
    olid         VARCHAR(20) UNIQUE,  -- Open Library Work ID
    title        VARCHAR(500) NOT NULL,
    description  TEXT,
    first_published SMALLINT,
    cover_url    TEXT,
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE editions (
    id             SERIAL PRIMARY KEY,
    work_id        INTEGER       NOT NULL,
    publisher_id   INTEGER,
    olid           VARCHAR(20)   UNIQUE,
    isbn_10        VARCHAR(10),
    isbn_13        VARCHAR(13),
    title          VARCHAR(500)  NOT NULL,
    publish_date   VARCHAR(50),
    number_of_pages SMALLINT,
    language       VARCHAR(10)   DEFAULT 'en',
    cover_url      TEXT,
    FOREIGN KEY (work_id)      REFERENCES works(id)      ON DELETE CASCADE,
    FOREIGN KEY (publisher_id) REFERENCES publishers(id)
);

CREATE TABLE work_authors (
    work_id   INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    role      VARCHAR(50) DEFAULT 'author',
    PRIMARY KEY (work_id, author_id),
    FOREIGN KEY (work_id)   REFERENCES works(id)   ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);

CREATE TABLE work_subjects (
    work_id    INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    PRIMARY KEY (work_id, subject_id),
    FOREIGN KEY (work_id)    REFERENCES works(id)    ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);`,
    sampleQueries: `-- Find all books by a given author with their editions and publishers
SELECT a.name AS author, w.title AS work, e.isbn_13, p.name AS publisher, e.publish_date
FROM authors a
JOIN work_authors wa ON wa.author_id = a.id
JOIN works w ON w.id = wa.work_id
LEFT JOIN editions e ON e.work_id = w.id
LEFT JOIN publishers p ON e.publisher_id = p.id
WHERE a.name ILIKE '%tolkien%';

-- Most popular subjects by number of works
SELECT s.name AS subject, COUNT(ws.work_id) AS work_count
FROM subjects s
JOIN work_subjects ws ON ws.subject_id = s.id
GROUP BY s.name
ORDER BY work_count DESC
LIMIT 20;

-- Works with multiple authors (collaborative works)
SELECT w.title, COUNT(wa.author_id) AS author_count
FROM works w
JOIN work_authors wa ON wa.work_id = w.id
GROUP BY w.title
HAVING COUNT(wa.author_id) > 1
ORDER BY author_count DESC;`
  }
]

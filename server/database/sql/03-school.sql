-- ---------------------------
-- ---       SUBJECT       ---
-- ---------------------------
CREATE DATABASE school;



-- ---------------------------
-- ---       TABLES        ---
-- ---------------------------

CREATE TABLE school.group (
	id INT NOT NULL AUTO_INCREMENT,
	name VARCHAR(50) NOT NULL,
	description VARCHAR(2500),
	
	PRIMARY KEY (id)
);

CREATE TABLE school.subject (
	id INT NOT NULL AUTO_INCREMENT,
	groupId INT NOT NULL,
	parentId INT 						COMMENT 'Self-referential foreign key for hierarchical subjects (e.g., Algebra is a child of Mathematics)',
	name VARCHAR(50) NOT NULL 			COMMENT 'Name of the subject (e.g., Mathematics, Science, Art, etc.)',
	description VARCHAR(2500) 			COMMENT 'Brief description of the subject',
	sortOrder INT 						COMMENT 'Order of subjects within the same parent group',
	
	nameKey VARCHAR(50) GENERATED ALWAYS AS (
		TRIM(BOTH '_' FROM REGEXP_REPLACE(
			REGEXP_REPLACE(
				REGEXP_REPLACE(LOWER(name), '[[:space:]]+', '_'), '[^a-z0-9_]', ''
			), '_+', '_'
		))
	) STORED 							COMMENT 'Normalized snake_case name used for per-group uniqueness',
	
	PRIMARY KEY (id),
	FOREIGN KEY (groupId) REFERENCES school.group(id) ON DELETE CASCADE,
	FOREIGN KEY (parentId) REFERENCES school.subject(id) ON DELETE SET NULL,
	UNIQUE KEY uq_subject_group_name_key (groupId, nameKey)
);



-- ---------------------------
-- ---       VIEWS         ---
-- ---------------------------

CREATE VIEW school.subjectHierarchyView AS
	WITH RECURSIVE hierarchy (id, groupId, parentId, name, description, sortOrder, idPath, path, sortPath) AS (
		SELECT 
			s.id,
			s.groupId,
			s.parentId,
			s.name,
			s.description,
			s.sortOrder,
			CAST(s.id AS CHAR(255)) AS idPath,
			CAST(s.name AS CHAR(2500)) AS path,
			CAST(CONCAT(LPAD(s.groupId, 10, 0), '|', LPAD(IFNULL(s.sortOrder, 9999), 4, 0), s.nameKey) AS CHAR(2500)) AS sortPath
		FROM school.subject s
		WHERE s.parentId IS NULL
		UNION ALL
		SELECT 
			s.id,
			s.groupId,
			s.parentId,
			s.name,
			s.description,
			s.sortOrder,
			CONCAT_WS(',', h.idPath, s.id) AS idPath,
			CONCAT_WS(' > ', h.path, s.name) AS path,
			CONCAT_WS('|', h.sortPath, CONCAT(LPAD(IFNULL(s.sortOrder, 9999), 4, 0), s.nameKey)) AS sortPath
		FROM school.subject s
		INNER JOIN hierarchy h ON s.parentId = h.id
	)
	SELECT 
		h.id,
		h.groupId,
		h.parentId,
		h.name,
		h.description,
		h.sortOrder,
		h.idPath,
		h.path,
		ROW_NUMBER() OVER (PARTITION BY h.groupId ORDER BY h.sortPath) - 1 AS sortIndex
	FROM hierarchy h
	GROUP BY
		h.id,
		h.groupId,
		h.parentId,
		h.name,
		h.description,
		h.sortOrder,
		h.idPath,
		h.path,
		h.sortPath
	ORDER BY h.groupId, h.sortPath;



-- ---------------------------
-- ---       INSERTS       ---
-- ---------------------------
INSERT INTO school.group (name, description) VALUES
	("Post Family Homeschool", "The Post family homeschool group, providing education for the Post children."),																			--id:  1 | name: Post Family Homeschool
	("Smith Family Homeschool", "The Smith family homeschool group, providing education for the Smith children."),																		--id:  2 | name: Smith Family Homeschool
	("Holden Academy", "Holden Academy, a private school offering a variety of subjects for students.");																				--id:  3 | name: Holden Academy

INSERT INTO school.subject (groupId, parentId, name, description, sortOrder) VALUES
	(1, NULL, "Mathematics", "The study of numbers, quantities, shapes, and patterns.", 1),																								--id:  1 | name: Mathematics		| parent: 
	(1, NULL, "Science", "The systematic study of the structure and behavior of the physical and natural world through observation and experiment.", 2),								--id:  2 | name: Science			| parent: 
	(1, NULL, "Computer Science", "The study of computers and computational systems, including their theory, design, development, and application.", 3);								--id:  3 | name: Computer Science	| parent: 
	(1, NULL, "Literature", "The art of written works, including fiction, poetry, and drama.", 4),																						--id:  4 | name: Literature			| parent: 
	(1, NULL, "Language Arts", "The study of language and its use, including reading, writing, and communication skills.", 5),															--id:  5 | name: Language Arts		| parent: 
	(1, NULL, "Foreign Languages", "The study of languages other than one's native language.", 6),																						--id:  6 | name: Foreign Languages	| parent: 
	(1, NULL, "History", "The study of past events, particularly in human affairs.", 7),																								--id:  7 | name: History			| parent: 
	(1, NULL, "Social Studies", "The study of human society and social relationships, including history, geography, economics, and civics.", 8),										--id:  8 | name: Social Studies		| parent: 
	(1, NULL, "Art", "The expression of human creativity and imagination through various mediums.", 9),																					--id:  9 | name: Art				| parent: 
	(1, NULL, "Music", "The art of arranging sounds in time to produce a composition through the elements of melody, harmony, rhythm, and timbre.", 10),								--id: 10 | name: Music				| parent: 
	(1, NULL, "Physical Education", "The study and practice of physical fitness and sports.", 11),																						--id: 11 | name: Physical Education	| parent: 
	(1, NULL, "Health Education", "The study of health and wellness, including physical, mental, and social health.", 12),																--id: 12 | name: Health Education	| parent: 
	(1, 1, "Algebra", "A branch of mathematics dealing with symbols and the rules for manipulating those symbols.", 1),																	--id: 13 | name: Algebra			| parent: Mathematics
	(1, 13, "Pre-Algebra", "A branch of mathematics that prepares students for algebra by introducing basic concepts and operations.", 1),												--id: 14 | name: Pre-Algebra		| parent: Algebra
	(1, 13, "Algebra 1", "A branch of mathematics that introduces the basic concepts of algebra, including variables, equations, and functions.", 2),									--id: 15 | name: Algebra 1			| parent: Algebra
	(1, 13, "Algebra 2", "A branch of mathematics that builds on Algebra 1 by introducing more complex concepts such as polynomials, rational expressions, and logarithms.", 3),		--id: 16 | name: Algebra 2			| parent: Algebra
	(1, 1, "Geometry", "A branch of mathematics concerned with the properties and relations of points, lines, surfaces, and solids.", 2),												--id: 17 | name: Geometry			| parent: Mathematics
	(1, 1, "Calculus", "A branch of mathematics that studies continuous change, through derivatives and integrals.", 3),																--id: 18 | name: Calculus			| parent: Mathematics
	(1, 1, "Statistics", "A branch of mathematics dealing with data collection, analysis, interpretation, and presentation.", 4),														--id: 19 | name: Statistics			| parent: Mathematics
	(1, 2, "Biology", "The study of living organisms, including their structure, function, growth, evolution, and distribution.", 1),													--id: 20 | name: Biology			| parent: Science
	(1, 2, "Chemistry", "The study of the composition, structure, properties, and change of matter.", 2),																				--id: 21 | name: Chemistry			| parent: Science
	(1, 2, "Physics", "The study of matter, energy, and the fundamental forces of nature.", 3),																							--id: 22 | name: Physics			| parent: Science
	(1, 2, "Earth Science", "The study of the Earth and its atmosphere, including geology, meteorology, oceanography, and astronomy.", 4),												--id: 23 | name: Earth Science		| parent: Science
	(1, 23, "Geology", "The study of the Earth, its materials, and the processes that shape it.", 1),																					--id: 24 | name: Geology			| parent: Earth Science
	(1, 3, "Programming", "The process of designing and building an executable computer program to accomplish a specific computing result or to perform a specific task.", 1),			--id: 25 | name: Programming		| parent: Computer Science
	(1, 5, "Grammar", "The set of structural rules governing the composition of clauses, phrases, and words in a language.", 1),														--id: 26 | name: Grammar			| parent: Language Arts
	(1, 5, "Writing", "The process of using symbols to communicate thoughts and ideas in a readable form.", 2),																			--id: 27 | name: Writing			| parent: Language Arts
	(1, 5, "Public Speaking", "The art of effective oral communication in front of an audience.", 3),																					--id: 28 | name: Public Speaking	| parent: Language Arts
	(1, 6, "Chinese", "The study of the Chinese language, including its characters, grammar, and pronunciation.", 1),																	--id: 29 | name: Chinese			| parent: Foreign Languages
	(1, 6, "Spanish", "The study of the Spanish language, including its grammar, vocabulary, and pronunciation.", 2),																	--id: 30 | name: Spanish			| parent: Foreign Languages
	(1, 8, "Current Events", "The study of recent and ongoing events in the world, including politics, economics, and social issues.", 1),												--id: 31 | name: Current Events		| parent: Social Studies
	(1, 8, "Geography", "The study of the Earth's physical features, climate, and human-environment interactions.", 2),																	--id: 32 | name: Geography			| parent: Social Studies
	(1, 11, "Fitness", "The study and practice of physical fitness and exercise.", 1),																									--id: 33 | name: Fitness			| parent: Physical Education
	(1, 11, "Sports", "The study and practice of competitive physical activities and games.", 2),																						--id: 34 | name: Sports				| parent: Physical Education
	(1, 12, "Nutrition", "The study of nutrients in food, how the body uses them, and the relationship between diet, health, and disease.", 1),											--id: 35 | name: Nutrition			| parent: Health Education
	(1, 12, "Mental Health", "The study of emotional, psychological, and social well-being.", 2);																						--id: 36 | name: Mental Health		| parent: Health Education

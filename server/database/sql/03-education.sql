-- ---------------------------
-- ---       SUBJECT       ---
-- ---------------------------
CREATE DATABASE education;


-- ---------------------------
-- ---       TABLES        ---
-- ---------------------------

-- Information about the school.
CREATE TABLE education.school (
	id INT NOT NULL AUTO_INCREMENT,
	name VARCHAR(50) NOT NULL,
	description VARCHAR(2500),
	
	PRIMARY KEY (id)
);

-- Information about a student in the school.
CREATE TABLE education.student (
	id INT NOT NULL AUTO_INCREMENT,
	firstName VARCHAR(50) NOT NULL,
	lastName VARCHAR(50) NOT NULL,
	preferredName VARCHAR(50) COMMENT 'Optional preferred name or nickname for the student',
	pronouns VARCHAR(50) COMMENT 'Optional pronouns for the student (e.g., he/him, she/her, they/them, etc.)',
	email VARCHAR(100) UNIQUE,
	dateOfBirth DATE NOT NULL,

	PRIMARY KEY (id)
);

-- Information about a teacher in the school.
CREATE TABLE education.teacher (
	id INT NOT NULL AUTO_INCREMENT,
	firstName VARCHAR(50) NOT NULL,
	lastName VARCHAR(50) NOT NULL,
	preferredName VARCHAR(50) COMMENT 'Optional preferred name or nickname for the teacher',
	pronouns VARCHAR(50) COMMENT 'Optional pronouns for the teacher (e.g., he/him, she/her, they/them, etc.)',
	email VARCHAR(100) UNIQUE,
	
	PRIMARY KEY (id),
	FOREIGN KEY (subjectId) REFERENCES education.subject(id) ON DELETE CASCADE
);

-- Information about a parent or guardian of a student.
CREATE TABLE education.parent (
	id INT NOT NULL AUTO_INCREMENT,
	firstName VARCHAR(50) NOT NULL,
	lastName VARCHAR(50) NOT NULL,
	preferredName VARCHAR(50) COMMENT 'Optional preferred name or nickname for the parent',
	pronouns VARCHAR(50) COMMENT 'Optional pronouns for the parent (e.g., he/him, she/her, they/them, etc.)',
	phone VARCHAR(20),
	email VARCHAR(100) UNIQUE,
	
	PRIMARY KEY (id)
);

-- Parent-child relationships between students and parents.
CREATE TABLE education.student_parent (
	studentId INT NOT NULL,
	parentId INT NOT NULL,
	relationship VARCHAR(50) NOT NULL COMMENT 'Relationship of the parent to the student (e.g., Mother, Father, Guardian, etc.)',
	
	PRIMARY KEY (studentId, parentId),
	FOREIGN KEY (studentId) REFERENCES education.student(id) ON DELETE CASCADE,
	FOREIGN KEY (parentId) REFERENCES education.parent(id) ON DELETE CASCADE
);

-- Information about a subject taught in the school.
CREATE TABLE education.subject (
	id INT NOT NULL AUTO_INCREMENT,
	schoolId INT NOT NULL,
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
	FOREIGN KEY (schoolId) REFERENCES education.school(id) ON DELETE CASCADE,
	FOREIGN KEY (parentId) REFERENCES education.subject(id) ON DELETE SET NULL,
	UNIQUE KEY uq_subject_school_name_key (schoolId, nameKey)
);

-- Information about a course.
CREATE TABLE education.course (
	id INT NOT NULL AUTO_INCREMENT,
	subjectId INT NOT NULL,
	name VARCHAR(100) NOT NULL,
	description VARCHAR(2500),
	
	PRIMARY KEY (id),
	FOREIGN KEY (subjectId) REFERENCES education.subject(id) ON DELETE CASCADE
);

-- Information about the teacher's role in a course.
CREATE TABLE education.course_teacher (
	courseId INT NOT NULL,
	teacherId INT NOT NULL,
	role ENUM('Primary', 'Assistant') NOT NULL DEFAULT 'Primary' COMMENT 'Role of the teacher in the course (e.g., Primary, Assistant)',
	
	PRIMARY KEY (courseId, teacherId),
	FOREIGN KEY (courseId) REFERENCES education.course(id) ON DELETE CASCADE,
	FOREIGN KEY (teacherId) REFERENCES education.teacher(id) ON DELETE CASCADE
);

-- Information about the student's enrollment in a course.
CREATE TABLE education.course_student (
	courseId INT NOT NULL,
	studentId INT NOT NULL,
	
	PRIMARY KEY (courseId, studentId),
	FOREIGN KEY (courseId) REFERENCES education.course(id) ON DELETE CASCADE,
	FOREIGN KEY (studentId) REFERENCES education.student(id) ON DELETE CASCADE
);

-- The lesson that was taught in a course.
CREATE TABLE education.lesson (
	id INT NOT NULL AUTO_INCREMENT,
	courseId INT NOT NULL,
	name VARCHAR(100) NOT NULL,
	description VARCHAR(2500),

	PRIMARY KEY (id),
	FOREIGN KEY (courseId) REFERENCES education.course(id) ON DELETE CASCADE
);

-- General information about an assignment.
CREATE TABLE education.course_assignment (
	id INT NOT NULL AUTO_INCREMENT,
	lessonId INT NOT NULL,
	name VARCHAR(100) NOT NULL,
	description VARCHAR(2500),
	dueDate DATE,
	
	PRIMARY KEY (id),
	FOREIGN KEY (lessonId) REFERENCES education.lesson(id) ON DELETE CASCADE
);

-- Information about the assignment specific to a student.
CREATE TABLE education.student_assignment (
	id INT NOT NULL AUTO_INCREMENT,
	courseAssignmentId INT NOT NULL,
	studentId INT NOT NULL,
	submissionDate DATE,
	submissionLink VARCHAR(2500),
	score DECIMAL(5,2),
	
	PRIMARY KEY (id),
	FOREIGN KEY (studentId) REFERENCES education.student(id) ON DELETE CASCADE,
	FOREIGN KEY (courseAssignmentId) REFERENCES education.course_assignment(id) ON DELETE CASCADE
);

CREATE TABLE education.assignment_comment (
	id INT NOT NULL AUTO_INCREMENT,
	courseAssignmentId INT,
	studentAssignmentId INT,
	teacherId INT,
	studentId INT,
	parentId INT,
	commentText MEDIUMTEXT NOT NULL COMMENT 'Markdown content; images and videos should be embedded as externally hosted URLs.',
	commentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
	
	PRIMARY KEY (id),
	FOREIGN KEY (courseAssignmentId) REFERENCES education.course_assignment(id) ON DELETE CASCADE,
	FOREIGN KEY (studentAssignmentId) REFERENCES education.student_assignment(id) ON DELETE CASCADE,
	FOREIGN KEY (teacherId) REFERENCES education.teacher(id) ON DELETE SET NULL,
	FOREIGN KEY (studentId) REFERENCES education.student(id) ON DELETE SET NULL,
	FOREIGN KEY (parentId) REFERENCES education.parent(id) ON DELETE SET NULL,
	CHECK (
		(courseAssignmentId IS NOT NULL AND studentAssignmentId IS NULL)
		OR (courseAssignmentId IS NULL AND studentAssignmentId IS NOT NULL)
	),
	CHECK (
		(teacherId IS NOT NULL AND studentId IS NULL AND parentId IS NULL)
		OR (teacherId IS NULL AND studentId IS NOT NULL AND parentId IS NULL)
		OR (teacherId IS NULL AND studentId IS NULL AND parentId IS NOT NULL)
	)
);


-- ---------------------------
-- ---       VIEWS         ---
-- ---------------------------

CREATE VIEW education.studentView AS
	SELECT 
		s.id,
		s.firstName,
		s.lastName,
		s.preferredName,
		s.pronouns,
		s.email,
		s.dateOfBirth,
		TIMESTAMPDIFF(YEAR, s.dateOfBirth, CURDATE()) - (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(s.dateOfBirth, '%m%d')) AS age,
		GROUP_CONCAT(CONCAT(sp.relationship, ': ', p.firstName, ' ', p.lastName) SEPARATOR '; ') AS parents
	FROM education.student s
	LEFT JOIN education.student_parent sp ON s.id = sp.studentId
	LEFT JOIN education.parent p ON sp.parentId = p.id
	GROUP BY s.id, s.firstName, s.lastName, s.preferredName, s.pronouns, s.email, s.dateOfBirth
	ORDER BY COALESCE(NULLIF(TRIM(preferredName), ''), firstName), lastName, dateOfBirth;

CREATE VIEW education.subjectHierarchyView AS
	WITH RECURSIVE hierarchy (id, schoolId, parentId, name, description, sortOrder, idPath, path, sortPath) AS (
		SELECT 
			s.id,
			s.schoolId,
			s.parentId,
			s.name,
			s.description,
			s.sortOrder,
			CAST(s.id AS CHAR(255)) AS idPath,
			CAST(s.name AS CHAR(2500)) AS path,
			CAST(CONCAT(LPAD(s.schoolId, 10, 0), '|', LPAD(IFNULL(s.sortOrder, 9999), 4, 0), s.nameKey) AS CHAR(2500)) AS sortPath
		FROM education.subject s
		WHERE s.parentId IS NULL
		UNION ALL
		SELECT 
			s.id,
			s.schoolId,
			s.parentId,
			s.name,
			s.description,
			s.sortOrder,
			CONCAT_WS(',', h.idPath, s.id) AS idPath,
			CONCAT_WS(' > ', h.path, s.name) AS path,
			CONCAT_WS('|', h.sortPath, CONCAT(LPAD(IFNULL(s.sortOrder, 9999), 4, 0), s.nameKey)) AS sortPath
		FROM education.subject s
		INNER JOIN hierarchy h ON s.parentId = h.id
	)
	SELECT 
		h.id,
		h.schoolId,
		h.parentId,
		h.name,
		h.description,
		h.sortOrder,
		h.idPath,
		h.path,
		ROW_NUMBER() OVER (PARTITION BY h.schoolId ORDER BY h.sortPath) - 1 AS sortIndex
	FROM hierarchy h
	GROUP BY
		h.id,
		h.schoolId,
		h.parentId,
		h.name,
		h.description,
		h.sortOrder,
		h.idPath,
		h.path,
		h.sortPath
	ORDER BY h.schoolId, h.sortPath;


-- ---------------------------
-- ---     PROCEDURES      ---
-- ---------------------------

DELIMITER $$

CREATE PROCEDURE education.normalizeSubjectSortOrder(
	IN pSchoolId INT,
	IN pParentId INT,
	IN pExcludeId INT,
	INOUT pSortOrder INT
)
BEGIN
	DECLARE siblingCount INT;

	SELECT COUNT(*)
	INTO siblingCount
	FROM education.subject s
	WHERE s.schoolId = pSchoolId
		AND (
			(pParentId IS NULL AND s.parentId IS NULL)
			OR (pParentId IS NOT NULL AND s.parentId = pParentId)
		)
		AND (pExcludeId IS NULL OR s.id <> pExcludeId);

	IF pSortOrder IS NULL THEN
		SET pSortOrder = siblingCount;
	END IF;

	IF pSortOrder < 0 THEN
		SET pSortOrder = 0;
	END IF;

	IF pSortOrder > siblingCount THEN
		SET pSortOrder = siblingCount;
	END IF;
END$$

CREATE PROCEDURE education.shiftSubjectSiblingsForInsert(
	IN pSchoolId INT,
	IN pParentId INT,
	IN pCurrentId INT,
	IN pSortOrder INT
)
BEGIN
	UPDATE education.subject s
	SET s.sortOrder = s.sortOrder + 1
	WHERE s.schoolId = pSchoolId
		AND s.id <> pCurrentId
		AND (
			(pParentId IS NULL AND s.parentId IS NULL)
			OR (pParentId IS NOT NULL AND s.parentId = pParentId)
		)
		AND s.sortOrder >= pSortOrder;
END$$

CREATE PROCEDURE education.shiftSubjectSiblingsForUpdate(
	IN pCurrentId INT,
	IN pOldSchoolId INT,
	IN pOldParentId INT,
	IN pOldSortOrder INT,
	IN pNewSchoolId INT,
	IN pNewParentId INT,
	IN pNewSortOrder INT
)
BEGIN
	IF pOldSchoolId = pNewSchoolId AND pOldParentId <=> pNewParentId THEN
		IF pNewSortOrder > pOldSortOrder THEN
			UPDATE education.subject s
			SET s.sortOrder = s.sortOrder - 1
			WHERE s.schoolId = pNewSchoolId
				AND s.id <> pCurrentId
				AND (
					(pNewParentId IS NULL AND s.parentId IS NULL)
					OR (pNewParentId IS NOT NULL AND s.parentId = pNewParentId)
				)
				AND s.sortOrder > pOldSortOrder
				AND s.sortOrder <= pNewSortOrder;
		ELSEIF pNewSortOrder < pOldSortOrder THEN
			UPDATE education.subject s
			SET s.sortOrder = s.sortOrder + 1
			WHERE s.schoolId = pNewSchoolId
				AND s.id <> pCurrentId
				AND (
					(pNewParentId IS NULL AND s.parentId IS NULL)
					OR (pNewParentId IS NOT NULL AND s.parentId = pNewParentId)
				)
				AND s.sortOrder >= pNewSortOrder
				AND s.sortOrder < pOldSortOrder;
		END IF;
	ELSE
		UPDATE education.subject s
		SET s.sortOrder = s.sortOrder - 1
		WHERE s.schoolId = pOldSchoolId
			AND s.id <> pCurrentId
			AND (
				(pOldParentId IS NULL AND s.parentId IS NULL)
				OR (pOldParentId IS NOT NULL AND s.parentId = pOldParentId)
			)
			AND s.sortOrder > pOldSortOrder;

		UPDATE education.subject s
		SET s.sortOrder = s.sortOrder + 1
		WHERE s.schoolId = pNewSchoolId
			AND s.id <> pCurrentId
			AND (
				(pNewParentId IS NULL AND s.parentId IS NULL)
				OR (pNewParentId IS NOT NULL AND s.parentId = pNewParentId)
			)
			AND s.sortOrder >= pNewSortOrder;
	END IF;
END$$


-- ---------------------------
-- ---      TRIGGERS       ---
-- ---------------------------

CREATE TRIGGER education.subject_before_insert_validate_sort_order
BEFORE INSERT ON education.subject
FOR EACH ROW
BEGIN
	CALL education.normalizeSubjectSortOrder(NEW.schoolId, NEW.parentId, NULL, NEW.sortOrder);
END$$

CREATE TRIGGER education.subject_after_insert_adjust_sort_order
AFTER INSERT ON education.subject
FOR EACH ROW
BEGIN
	CALL education.shiftSubjectSiblingsForInsert(NEW.schoolId, NEW.parentId, NEW.id, NEW.sortOrder);
END$$

CREATE TRIGGER education.subject_before_update_validate_sort_order
BEFORE UPDATE ON education.subject
FOR EACH ROW
BEGIN
	CALL education.normalizeSubjectSortOrder(NEW.schoolId, NEW.parentId, OLD.id, NEW.sortOrder);
END$$

CREATE TRIGGER education.subject_after_update_adjust_sort_order
AFTER UPDATE ON education.subject
FOR EACH ROW
BEGIN
	CALL education.shiftSubjectSiblingsForUpdate(
		NEW.id,
		OLD.schoolId,
		OLD.parentId,
		OLD.sortOrder,
		NEW.schoolId,
		NEW.parentId,
		NEW.sortOrder
	);
END$$

DELIMITER ;


-- ---------------------------
-- ---       INSERTS       ---
-- ---------------------------

INSERT INTO education.school (name, description) VALUES
	("Post Family Homeschool", "The Post family homeschool group, providing education for the Post children."),																			--id:  1 | name: Post Family Homeschool
	("Smith Family Homeschool", "The Smith family homeschool group, providing education for the Smith children."),																		--id:  2 | name: Smith Family Homeschool
	("Holden Academy", "Holden Academy, a private school offering a variety of subjects for students.");																				--id:  3 | name: Holden Academy

INSERT INTO education.student (firstName, lastName, preferredName, pronouns, email, dateOfBirth) VALUES
	("Evelyn", "Post", "Mars", "he/him", "post.evie@gmail.com", "2013-01-31"),																											--id: 1 | name: Mars Post
	("Rayla", "Post", NULL, "she/her", "2020-04-04");																																	--id: 2 | name: Rayla Post

INSERT INTO education.teacher (firstName, lastName, preferredName, pronouns, email) VALUES
	("Thomas", "Post", "Makai", "he/him", "post.makai@gmail.com"),																														--id: 1 | name: Makai Post
	("Katherine", "Post", NULL, "she/her", "post.katherine@gmail.com");																													--id: 2 | name: Katherine Post

INSERT INTO education.parent (firstName, lastName, preferredName, pronouns, phone, email) VALUES
	("Thomas", "Post", "Makai", "he/him", "2067450402", "post.makai@gmail.com"),																										--id: 1 | name: Makai Post
	("Katherine", "Post", NULL, "she/her", "2067450403", "post.katherine@gmail.com");																									--id: 2 | name: Katherine Post

INSERT INTO education.student_parent (studentId, parentId, relationship) VALUES
	(1, 1, "Father"),																																									--student: Mars Post | parent: Makai Post | relationship: Father
	(1, 2, "Mother"),																																									--student: Mars Post | parent: Katherine Post | relationship: Mother
	(2, 1, "Father"),																																									--student: Rayla Post | parent: Makai Post | relationship: Father
	(2, 2, "Mother");																																									--student: Rayla Post | parent: Katherine Post | relationship: Mother

INSERT INTO education.subject (schoolId, parentId, name, description, sortOrder) VALUES
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

INSERT INTO education.course (subjectId, name, description) VALUES
	(16, "Algebra 2", "A branch of mathematics that builds on Algebra 1 by introducing more complex concepts such as polynomials, rational expressions, and logarithms."),				--id: 1 | name: Algebra 2 				| subject: Algebra
	{25, "Intro to Programming", "An introductory course on programming concepts and languages."},																						--id: 2 | name: Intro to Programming 	| subject: Programming
	{4, "Reading Comprehension", "A course focused on improving reading comprehension skills through analysis of various texts."},														--id: 3 | name: Reading Comprehension 	| subject: Literature
	{29, "Chinese Basics", "An introductory course on the Chinese language, including basic grammar, vocabulary, and pronunciation."},													--id: 4 | name: Chinese 101 			| subject: Chinese
	{31, "Current Events Analysis", "A course that explores current events and their impact on society, politics, and the economy."},													--id: 5 | name: Current Events Analysis | subject: Current Events
	{33, "Physical Fitness", "A course focused on improving physical fitness through exercise and healthy lifestyle habits."},															--id: 6 | name: Physical Fitness 		| subject: Fitness
	{35, "Nutrition Science", "A course that explores the science of nutrition, including the role of nutrients in the body and the relationship between diet and health."},			--id: 7 | name: Nutrition Science 		| subject: Nutrition
	{36, "Mental Health Awareness", "A course that promotes mental health awareness and provides strategies for maintaining mental well-being."};										--id: 8 | name: Mental Health Awareness | subject: Mental Health

INSERT INTO education.course_teacher (courseId, teacherId, role) VALUES
	(1, 1, "Primary"),																																									--course: Algebra 2					| teacher: Makai Post			| role: Primary
	(2, 1, "Primary"),																																									--course: Intro to Programming 		| teacher: Makai Post			| role: Primary
	(3, 1, "Primary"),																																									--course: Reading Comprehension 	| teacher: Makai Post			| role: Primary
	(4, 2, "Primary"),																																									--course: Chinese 101 				| teacher: Katherine Post		| role: Primary
	(5, 1, "Primary"),																																									--course: Current Events Analysis 	| teacher: Makai Post			| role: Primary
	(6, 2, "Primary"),																																									--course: Physical Fitness 			| teacher: Katherine Post		| role: Primary
	(7, 2, "Primary"),																																									--course: Nutrition Science 		| teacher: Katherine Post		| role: Primary
	(8, 2, "Primary");																																									--course: Mental Health Awareness 	| teacher: Katherine Post		| role: Primary

INSERT INTO education.course_student (courseId, studentId) VALUES
	(1, 1),																																												--course: Algebra 2					| student: Mars Post
	(2, 1),																																												--course: Intro to Programming 		| student: Mars Post
	(3, 1),																																												--course: Reading Comprehension 	| student: Mars Post
	(4, 1),																																												--course: Chinese 101 				| student: Mars Post
	(5, 1),																																												--course: Current Events Analysis 	| student: Mars Post
	(6, 1),																																												--course: Physical Fitness 			| student: Mars Post
	(7, 1),																																												--course: Nutrition Science 		| student: Mars Post
	(8, 1);																																												--course: Mental Health Awareness 	| student: Mars Post

INSERT INTO education.lesson (courseId, name, description) VALUES
	(1, "Quadratic Equations", "An introduction to quadratic equations, including their properties and methods for solving them."),															--id: 1 | name: Quadratic Equations 	| course: Algebra 2
	(2, "Variables and Data Types", "An introduction to programming concepts, including variables, data types, and basic syntax."),														--id: 2 | name: Variables and Data Types | course: Intro to Programming
	(3, "Analyzing Fiction", "A lesson focused on analyzing fictional texts to improve reading comprehension skills."),																	--id: 3 | name: Analyzing Fiction 		| course: Reading Comprehension
	(4, "Basic Chinese Grammar", "A lesson covering basic Chinese grammar concepts, including sentence structure and common particles."),												--id: 4 | name: Basic Chinese Grammar 	| course: Chinese 101
	(5, "Media Literacy", "A lesson that explores media literacy skills for analyzing news sources and understanding bias in current events."),												--id: 5 | name: Media Literacy 			| course: Current Events Analysis
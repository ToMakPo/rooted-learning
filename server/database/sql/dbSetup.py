import argparse
import mysql.connector
import glob
import re
import os
from dotenv import load_dotenv

def get_env_var(names, default=None):
	for name in names:
		value = os.getenv(name)
		if value is not None and value != '':
			return value
	return default

def run_sql_file(filename, cnx):
	file = open(filename, 'r', encoding='utf-8')  # Open the file with 'utf-8' encoding
	sql = file.read()

	sql = re.sub(r'--.*$', "", sql, flags=re.MULTILINE)  # Remove single line comments
	sql = re.sub(r'/\*.*?\*/', "", sql, flags=re.DOTALL)  # Remove multi-line comments

	sql = sql.replace('DELIMITER $$', '^'*15 + '@@@')
	sql = sql.replace('DELIMITER ;', '^'*15)

	cursor = cnx.cursor()
	for script in sql.split('^'*15):
		delimiter = ';' 
		if script.startswith('@@@'):
			delimiter = '$$'
			script = script[3:]

		for command in script.split(delimiter):
			command = command.strip()
			if command == '' or command.startswith('SELECT'): continue

			cursor.execute(command)
	cnx.commit()

def find_schema_dependents(schema, dependents, cnx):
	if schema in dependents: return dependents

	dependents.append(schema)
	
	command = f"""
		SELECT DISTINCT TABLE_SCHEMA
		FROM information_schema.KEY_COLUMN_USAGE 
		WHERE REFERENCED_TABLE_SCHEMA = '{schema}'
	"""
	
	cursor = cnx.cursor()
	cursor.execute(command)

	rows = cursor.fetchall()

	for row in rows:
		dependent = row[0]
		dependents = find_schema_dependents(dependent, dependents, cnx)
	
	cnx.commit()

	return dependents

def main():
	# Parse command line arguments
	parser = argparse.ArgumentParser()
	parser.add_argument('schemas', nargs='*', default=None)
	args = parser.parse_args()

	# Load environment variables from server/.env
	env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
	load_dotenv(env_path)

	db_host = get_env_var(['DB_HOST', 'MYSQL_HOST'], 'localhost')
	db_port = int(get_env_var(['DB_PORT', 'MYSQL_PORT'], '3306'))
	db_user = get_env_var(['DB_USER', 'MYSQL_USER'])
	db_password = get_env_var(['DB_PASSWORD', 'MYSQL_PASSWORD'])

	if not db_user or db_password is None:
		raise ValueError(
			'Missing database credentials. Set DB_USER and DB_PASSWORD (or MYSQL_USER and MYSQL_PASSWORD) in server/.env.'
		)

	# Establish the database connection
	cnx = mysql.connector.connect(
		host=db_host,
		port=db_port,
		user=db_user,
		password=db_password
	)

	# Get a list of all .sql files in the directory
	sql_files = glob.glob('*.sql') # get all .sql files in the current directory
	
	all_schemas = {}

	for fileName in sql_files:
		name = '_'.join(fileName.split('.')[0].split('-')[1:])

		all_schemas[name] = { 
			'name': name, 
			'order': fileName.split('.')[0].split('-')[0], 
			'fileName': fileName, 
			'run': name in args.schemas
		}

	# Sort the schemas by order and get a list of all schemas to run
	run_schemas = sorted(
		[schema['name'] for schema in all_schemas.values() if schema['run']] if len(args.schemas) > 0 else all_schemas.keys()
		, key=lambda x: all_schemas[x]['order'])
	
	# Get a list of all dependent schemas
	dependent_schemas = []

	for schema in run_schemas:
		dependent_schemas = find_schema_dependents(schema, dependent_schemas, cnx)
	
	dependent_schemas = sorted(dependent_schemas, key=lambda x: all_schemas[x]['order'], reverse=True)
	
	# Drop all dependent schemas
	
	cursor = cnx.cursor()
	
	cursor.execute('SET FOREIGN_KEY_CHECKS = 0')

	for schema in dependent_schemas:
		cursor.execute(f'DROP DATABASE IF EXISTS {schema}')
	
	cursor.execute('SET FOREIGN_KEY_CHECKS = 1')
	
	cnx.commit()

	# Add all dropped schemas to the run list if they are not already there and sort the list
	run_schemas = sorted(list(set(run_schemas + dependent_schemas)), key=lambda x: all_schemas[x]['order'])

	# Execute the .sql file
	for schema in run_schemas:
		schema = all_schemas[schema]
		run_sql_file(schema['fileName'], cnx)

	# Close the database connection
	cnx.close()

	# Print feedback
	print('All done!' + ((' (' + ', '.join(run_schemas) + ')') if args.schemas else ''))

if __name__ == "__main__":
	main()
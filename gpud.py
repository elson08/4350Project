
import sqlite3

def get_connection():
    # Connect to the database
    connect = sqlite3.connect("AutoParts.db")
    connect.row_factory = sqlite3.Row
    connect.execute("PRAGMA foreign_keys = ON ")
    return connect

def get_record(table, key=None, args=None):
    connect = get_connection()

    # Check the table exists
    cursor = connect.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (table,)
    )

    # If not, return and print error
    if cursor.fetchone() is None:
        print("Table not found")
        connect.close()
        return 1

    #Check the primary key exists
    cursor = connect.execute(f'PRAGMA table_info("{table}")')
    columns = cursor.fetchall()

    # Get all keys
    primary_keys = []
    for column in columns:
        if column[5] > 0:
            primary_keys.append(column[1])

            # Understand the structure here of the records
            # When you get a record, each column or field in the record has more info
            # 0: Index
            # 1: Name
            # 2: type
            # 3: Not Null constraint
            # 4: default value 
            # 5: primary key candidacy

            # With that last field  
            # 0 > It is not a pk
            # 1 > It is a pk  
            # 2,3,... > Part of a pk

    # Check each argument exists
    column_names = [column[1] for column in columns]
    if args is not None:
        for arg in args:
            if arg not in column_names:
                print("Argument key does not exist")
                connect.close()
                return 1

    if key is not None:
        # Normalize the key to allow for composite pks
        if not isinstance(key, tuple):
            key = (key,)

        # Confirm key length matches
        if len(key) != len(primary_keys):
            print("Key count is incorrect")
            connect.close()
            return 1

    # Create SQL call
    sql = f'Select * FROM "{table}"'
    parameters = []
    conditions = []

    # Create conditions
    if key is not None:
        for column, value in zip(primary_keys, key):
            conditions.append(f'"{column}" = ?')
            parameters.append(value)

    if args is not None:
        for column, value in args.items():
            conditions.append(f'"{column}" = ?')
            parameters.append(value)

    # Add WHERE clause
    if conditions:
        sql += " WHERE " + " AND ".join(conditions)

    # Execute the SQL
    cursor = connect.execute(sql, parameters)

    # Get records
    records = cursor.fetchall()

    # Convert to dictionaries
    result = [dict(record) for record in records]

    # Close db
    connect.close()

    return result

def insert_record(table, json):
    connect = get_connection()

    # Check the table exists
    cursor = connect.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (table,)
    )

    # Check the JSON is a dict object
    if not isinstance(json, dict) or not json:
        print("JSON object must be a dictionary")
        connect.close()
        return 1

    if cursor.fetchone() is None:
        print("Table not found")
        connect.close()
        return 1

    # Verify key names
    input_keys = []
    for key in json:
        input_keys.append(key)

    #Check the primary key exists
    cursor = connect.execute(f'PRAGMA table_info("{table}")')
    columns = cursor.fetchall()
        
    # Get required keys
    req_keys = [] 
    all_keys = []
    for column in columns:
            if column[3] == 1 and column[4] is None:
                req_keys.append(column[1])
            if column[5] > 0:
                req_keys.append(column[1])
            all_keys.append(column[1])

    # Confirm input format and keys are correct
    # Dont need to check for duplicate keys as python already does that
    # Confirm min number of keys is found

    # Check required keys are present
    for key in req_keys:
        if key not in input_keys:
            print(f"Missing a required key: {key}")
            connect.close()
            return 1

    # Check all input keys are valid
    for key in input_keys:
        if key not in all_keys:
            print(f"Invalid key: {key}")
            connect.close()
            return 1

    # Get the input values for the sql
    # I already got the keys above
    input_values = []
    for value in json.values():
        input_values.append(value)

    # Create the SQL
    sql = f'INSERT INTO "{table}" ({", ".join(input_keys)}) VALUES({", ".join("?" for _ in input_values)})'

    # Run the SQL
    try:
        connect.execute(sql, input_values)
        connect.commit()
        return 0
    except sqlite3.IntegrityError as error:
        print(f"Database constraint error: {error}")
        return 1
    except sqlite3.Error as error:
        print(f"Database error: {error}")
        return 1
    finally:
        connect.close()

def delete_record(table, json):

    # Verify some input
    if not table or json is None:
        print("Missing input")
        return 1

    # Create connection to db
    connect = get_connection()

    # Check the table exists
    cursor = connect.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (table,)
    )

    if cursor.fetchone() is None:
        print("Table not found")
        connect.close()
        return 1

    # Check the JSON is a dict object
    if not isinstance(json, dict) or not json:
        print("JSON object must be a dictionary")
        connect.close()
        return 1

    # Get the input columns and values
    input_keys = []
    input_values = []

    for key in json.keys():
        input_keys.append(key)

    for value in json.values():
        input_values.append(value)

    # Get the table columns
    table_keys = []
    cursor = connect.execute(f'PRAGMA table_info("{table}")')
    columns = cursor.fetchall()

    for column in columns:
        table_keys.append(column[1])

    # Verify input keys are present in table
    for key in input_keys:
        if key not in table_keys:
            print(f"Key not found in the table: {key}")
            connect.close()
            return 1

    # Create SQL conditions
    conditions = []
    for key in input_keys:
        conditions.append(f'"{key}" = ?')

    # Create the SQL
    sql = f'DELETE FROM "{table}" WHERE {" AND ".join(conditions)}'

    try:
        cursor = connect.execute(sql, input_values)
        connect.commit()
        return 0
    except sqlite3.IntegrityError as error:
        print(f"Database error: {error}")
        return 1
    except sqlite3.Error as error:
        print(f"Database error: {error}")
        return 1
    finally:
        connect.close()

        
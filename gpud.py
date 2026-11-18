
import sqlite3

def get_connection():
    # Connect to the database
    connect = sqlite3.connect("AutoParts.db")
    connect.row_factory = sqlite3.Row
    connect.execute("PRAGMA foreign_keys = ON ")
    return connect

def get_record(table, json):
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

    table_keys = []
    for column in columns:
                table_keys.append(column[1])

    input_values = []
    input_keys = []

    # Check each argument exists
    if json is not None:
        for key in json.keys():
            input_keys.append(key)
        for value in json.values():
            input_values.append(value)
        for key in input_keys:
            if key not in table_keys:
                print("Input key does not exist")
                connect.close()
                return 1


    # Create the SQL
    sql = f'SELECT * FROM "{table}"'

    if json:
        conditions = " AND ".join(f'"{key}" = ?' for key in input_keys)
        sql += f" WHERE {conditions}"
    
    # Run the SQL
    try:
        cursor = connect.execute(sql, input_values)
        result = cursor.fetchall()
        return [dict(record) for record in result]
    except sqlite3.IntegrityError as error:
        print(f"Database constraint error: {error}")
        return 1
    except sqlite3.Error as error:
        print(f"Database error: {error}")
        return 1
    finally:
        connect.close()

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
    #req_keys = [] 
    #all_keys = []
    #for column in columns:
    #        if column[3] == 1 and column[4] is None:
    #            req_keys.append(column[1])
    #        if column[5] > 0:
    #            req_keys.append(column[1])
    #        all_keys.append(column[1])
    req_keys = []
    all_keys = []

    for column in columns:
        column_name = column[1]
        column_type = column[2]
        not_null = column[3]
        default_value = column[4]
        primary_key = column[5]

    # An INTEGER PRIMARY KEY is generated automatically by SQLite
        if primary_key > 0 and column_type.upper() == "INTEGER":
            all_keys.append(column_name)
            continue

        if not_null == 1 and default_value is None:
            req_keys.append(column_name)

        if primary_key > 0:
            req_keys.append(column_name)

        all_keys.append(column_name)
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
        result = connect.execute(sql, input_values)
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

def update_record(table, json):

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
        condition_keys = []
        update_keys = []
        condition_values = []
        update_values = []
    
        for key in json["conditions"].keys():
            condition_keys.append(key)

        for key in json["updates"].keys():
            update_keys.append(key)

        for value in json["conditions"].values():
            condition_values.append(value)

        for value in json["updates"].values():
                    update_values.append(value)
    
        # Get the table columns
        table_keys = []
        cursor = connect.execute(f'PRAGMA table_info("{table}")')
        columns = cursor.fetchall()
    
        for column in columns:
            table_keys.append(column[1])
    
        # Verify condition keys are present in table
        for key in condition_keys:
            if key not in table_keys:
                print(f" Condition key not found in the table: {key}")
                connect.close()
                return 1

        # Verify update keys are present in table
        for key in update_keys:
            if key not in table_keys:
                print(f"Update key not found in the table: {key}")
                connect.close()
                return 1

        # Create the SET
        updates = []

        for key in update_keys:
            updates.append(f'"{key}" = ?')

        # Create the WHERE
        conditions = []

        for key in condition_keys:
            conditions.append(f'"{key}" = ?')

        # Create the SQL
        sql = f'UPDATE "{table}" SET {", ".join(updates)} WHERE {" AND".join(conditions)}'
        parameters = update_values + condition_values

        try:
            cursor = connect.execute(sql, parameters)
            connect.commit()
            print("Updated Record")
            return 0
        except sqlite3.IntegrityError as error:
            print(f"Database error: {error}")
            return 1
        except sqlite3.Error as error:
            print(f"Database error: {error}")
            return 1
        finally:
            connect.close()
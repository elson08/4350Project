
import sqlite3
from contextlib import closing

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
    if not isinstance(json, dict) or not json:
        print("JSON object must be a dictionary")
        return 1

    try:
        with closing(get_connection()) as connect, connect:
            table_exists = connect.execute(
                "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
                (table,),
            ).fetchone()
            if not table_exists or table.lower().startswith("sqlite_"):
                print("Table not found")
                return 1

            columns = connect.execute(
                "SELECT name, type, [notnull], dflt_value, pk FROM pragma_table_info(?)",
                (table,),
            ).fetchall()
            column_names = {column["name"] for column in columns}
            unknown_keys = json.keys() - column_names
            if unknown_keys:
                print(f"Invalid keys: {', '.join(sorted(unknown_keys))}")
                return 1

            indexes = connect.execute(
                "SELECT origin FROM pragma_index_list(?)", (table,)
            ).fetchall()
            has_primary_key_index = any(index["origin"] == "pk" for index in indexes)
            for column in columns:
                is_primary_key = column["pk"] > 0
                is_generated_key = (
                    is_primary_key
                    and column["type"].upper() == "INTEGER"
                    and not has_primary_key_index
                )
                is_required = is_primary_key or (
                    column["notnull"] and column["dflt_value"] is None
                )
                if is_required and not is_generated_key and column["name"] not in json:
                    print(f"Missing a required key: {column['name']}")
                    return 1

            quoted_table = '"' + table.replace('"', '""') + '"'
            quoted_columns = ['"' + key.replace('"', '""') + '"' for key in json]
            placeholders = ", ".join("?" for _ in json)
            sql = f"INSERT INTO {quoted_table} ({', '.join(quoted_columns)}) VALUES ({placeholders})"
            cursor = connect.execute(sql, tuple(json.values()))
            return {"rowsInserted": cursor.rowcount}
    except sqlite3.IntegrityError as error:
        print(f"Database constraint error: {error}")
        return 1
    except sqlite3.Error as error:
        print(f"Database error: {error}")
        return 1

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

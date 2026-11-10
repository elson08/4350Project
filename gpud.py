
import sqlite3

def get_connection():
    # Connect to the database
    connect = sqlite3.connect("AutoParts.db")
    connect.row_factory = sqlite3.Row
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
# Retail Auto Parts System

CSCE 4350 project. A React website (`frontend/`) backed by a Flask API (`api.py`) and a SQLite database (`AutoParts.db`).

## Running the project

Run the API and the website in two separate terminals.

### API

1. Install Flask:
   ```
   python -m pip install flask
   ```
2. From the project folder, start the server:
   ```
   python api.py
   ```
   It listens on http://127.0.0.1:5000. Start it from the project folder, or it won't find `AutoParts.db`.

### Website

1. Install packages (first time only):
   ```
   cd frontend
   npm install
   ```
2. Start the site:
   ```
   npm run dev
   ```
3. Open http://localhost:5173.

## Database (Letos)

### Getting started

1. Go to https://letos.org/ and download the installer.
2. Run the installer and open it. This gives you a graphical interface for SQLite.

### Importing

1. Pull the `.db` file from GitHub.
2. Open Letos (4.0.4).
3. Click **Database > Add a database**.
4. Find the `.db` file in your file explorer and open it.

### Exporting

1. Save the `.db` file.
2. Push it to GitHub.

### Creating a table

1. Right click **Tables > Create a table**.
2. Enter the table name.
3. Double click the empty space under Name | Data type | etc.
4. Add the key type. To change it later, double click the row.
5. Enter the column info.
6. Apply the constraints.
7. Press **Okay**.
8. When all rows are done, press the green check mark to save.
9. Press **OK**.
10. Push to GitHub.

## API requests

Replace `table` with a table name, and the columns and values with real ones.

### GET

Filters go in the query string.

From the command line:
```
curl "http://127.0.0.1:5000/table?column1=value1&column2=value2"
```

From the website:
```js
fetch("http://127.0.0.1:5000/table?column1=value1&column2=value2")
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error(error));
```

### POST

From the command line:
```
curl -X POST http://127.0.0.1:5000/table -H "Content-Type: application/json" -d "{\"column1\": \"value1\", \"column2\": \"value2\"}"
```

From the website:
```js
fetch("http://127.0.0.1:5000/table", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ column1: "value1", column2: "value2" })
})
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error(error));
```

### DELETE

From the command line:
```
curl -X DELETE http://127.0.0.1:5000/table -H "Content-Type: application/json" -d "{\"column1\": \"value1\", \"column2\": \"value2\"}"
```

From the website:
```js
fetch("http://127.0.0.1:5000/table", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ column1: "value1", column2: "value2" })
})
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error(error));
```

from flask import Flask, jsonify, request
import gpud

# Name the flask app
app = Flask(__name__)

# Get the incoming call and sort it
# This first line handles requests where no specific record ID was given
# Largely for multi record requests
@app.route("/<table>", defaults={"key": None}, methods=["GET", "POST"])

# This second line handles requests where an ID was given
# Largely for single record requests 
@app.route("/<table>/<key>", methods=["GET"])

# Filtering and conditions and be found in request.args and method under request.method
def route_request(table, key):

    if key is not None:
        key = tuple(int(value) for value in key.split(","))

    # If there was a GET call
    if request.method == "GET":
        result = gpud.get_record(
            table, 
            key,
            request.args.to_dict()
        )

    # If there was a POST call
    if request.method == "POST":
        result = gpud.insert_record(
            table,
            request.get_json()
        )

    # Return a JSON object
    if result == 1:
        return jsonify({"message":"Record failed to insert, see the server log"}), 201
    else:
        return jsonify({"message":"Record insertion completed"}), 400

# Start the server
if __name__ == "__main__":
    app.run(debug=True)
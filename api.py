from flask import Flask, jsonify, request
import gpud

# Name the flask app
app = Flask(__name__)

# Get the incoming call and sort it
# This first line handles requests where no specific record ID was given
# Largely for multi record requests
@app.route("/<table>", defaults={"key": None}, methods=["GET"])

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

    # Return a JSON object
    return jsonify(result)

# Start the server
if __name__ == "__main__":
    app.run(debug=True)
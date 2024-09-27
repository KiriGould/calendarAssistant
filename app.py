import os
import json
import datetime
from flask import Flask, jsonify
from flask_cors import CORS
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]

def get_google_calendar_events():
    """Fetches the next 10 Google Calendar events and returns them as JSON."""
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first time.
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "credentials.json", SCOPES
            )
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open("token.json", "w") as token:
            token.write(creds.to_json())

    try:
        service = build("calendar", "v3", credentials=creds)

        # Call the Calendar API
        now = datetime.datetime.utcnow().isoformat() + "Z"  # 'Z' indicates UTC time
        events_result = (
            service.events()
            .list(
                calendarId="primary",
                timeMin=now,
                maxResults=10,
                singleEvents=True,
                orderBy="startTime",
            )
            .execute()
        )
        events = events_result.get("items", [])

        # Return the events in JSON format
        event_list = []
        for event in events:
            start = event["start"].get("dateTime", event["start"].get("date"))
            event_data = {
                "start": start,
                "summary": event["summary"]
            }
            event_list.append(event_data)

        return event_list

    except HttpError as error:
        print(f"An error occurred: {error}")
        return []

@app.route('/api/events', methods=['GET'])
def get_events():
    """API endpoint to get Google Calendar events as JSON."""
    events = get_google_calendar_events()
    return jsonify(events)

if __name__ == "__main__":
    app.run(debug=True)
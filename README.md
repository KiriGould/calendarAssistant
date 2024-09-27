To-Do List Generator App

This is a To-Do List Generator app that integrates with a local Ollama GPT server to generate task lists for appointments. The app fetches appointments from a backend API (Flask) and generates personalized to-do lists using the Ollama GPT model.

Features

Fetch appointments from a backend API.
Generate tasks using a custom AI prompt based on the appointment summary.
Display an introductory sentence followed by a list of checkable tasks for each appointment.
Track task completion by allowing users to check/uncheck tasks in the list.
Requirements

Before running this app, ensure you have the following:

Node.js and npm installed on your machine.
Python Flask API running to serve appointments data.
Ollama GPT Server running locally on http://localhost:11434.

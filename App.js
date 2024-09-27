import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [appointments, setAppointments] = useState([]);
  const [tasks, setTasks] = useState({});
  const [taskIntro, setTaskIntro] = useState({}); // Store introductory sentence separately
  const [currentDate] = useState(new Date().toLocaleDateString()); // Get the current date
  const [loadingTask, setLoadingTask] = useState(null); // Loading state for each task generation

  // Fetch appointments from Flask API when component loads
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/events');
        setAppointments(response.data);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };

    fetchAppointments();
  }, []);

  // Function to call Ollama to generate a to-do list
  const generateToDoList = async (appointmentSummary, appointmentStart) => {
    const prompt = `Make a list of items that is as short as possible for the following task: ${appointmentSummary} given it is ${currentDate}. Only give bullet points. Make sure it is appropriate for people who have ADHD and break it down into small tasks. Format it as follows and use emojis to better visualize each item: • Item 1\n• Item 2\n• Item 3`;

    setLoadingTask(appointmentStart); // Show loading spinner for this appointment

    try {
      console.log(`Making API call for appointment: ${appointmentSummary}`);

      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'llama3.2', // Adjust to the model you're using
        prompt: prompt,
        stream: false
      });

      console.log('Ollama API Full Response:', response); // Log the full response object

      if (response && response.data && response.data.response) {
        const responseText = response.data.response; // Extract the response field from the API response

        console.log('Response Text:', responseText); // Log the response text

        // Split by the first bullet point to separate the intro from the tasks
        const [introText, ...taskParts] = responseText.split('•'); // Split by bullet point

        console.log('Introductory text:', introText.trim()); // Log the intro sentence
        console.log('Task lines:', taskParts); // Log the task lines

        // Check if the response has tasks and extract them
        const tasks = taskParts
          .map(task => ({ text: task.trim(), completed: false })) // Store task text and completion status
          .filter(task => task.text.length > 0); // Filter out any empty tasks

        if (tasks.length > 0) {
          // Set the tasks and the intro text in the state
          setTasks((prevTasks) => ({
            ...prevTasks,
            [appointmentStart]: tasks, // Set tasks for this specific appointment
          }));
          setTaskIntro((prevIntro) => ({
            ...prevIntro,
            [appointmentStart]: introText.trim(), // Set the intro sentence for this specific appointment
          }));
          console.log('Formatted tasks:', tasks); // Log the formatted tasks
        } else {
          console.error('No tasks were found in the response.');
        }
      } else {
        console.error('Error: No data found in API response or malformed response.');
      }
    } catch (error) {
      console.error('Error generating to-do list:', error);
    } finally {
      setLoadingTask(null); // Hide loading spinner after task generation
    }
  };

  // Function to toggle task completion
  const toggleTaskCompletion = (appointmentStart, taskIndex) => {
    setTasks((prevTasks) => {
      const updatedTasks = [...prevTasks[appointmentStart]];
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        completed: !updatedTasks[taskIndex].completed, // Toggle completion
      };
      return {
        ...prevTasks,
        [appointmentStart]: updatedTasks,
      };
    });
  };

  return (
    <div>
      <h1>Appointments</h1>
      <p>Current Date: {currentDate}</p>
      {appointments.length > 0 ? (
        <ul>
          {appointments.map((appointment, index) => (
            <li key={index}>
              <strong>{appointment.start}:</strong> {appointment.summary}
              <br />
              <button
                onClick={() => generateToDoList(appointment.summary, appointment.start)}
                disabled={loadingTask === appointment.start} // Disable button if loading
              >
                {loadingTask === appointment.start ? 'Generating...' : 'Generate To-Do List'}
              </button>
              <br />
              {/* Display the introductory sentence */}
              {taskIntro[appointment.start] && (
                <div className="intro-text-bubble">
                  <p>{taskIntro[appointment.start]}</p>
                </div>
              )}
              {/* Display the tasks if they exist */}
              {tasks[appointment.start] && tasks[appointment.start].length > 0 ? (
                <div>
                  <h3>To-Do List:</h3>
                  <ul>
                    {tasks[appointment.start].map((task, taskIndex) => (
                      <li key={taskIndex}>
                        <label>
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTaskCompletion(appointment.start, taskIndex)}
                          />
                          {task.text}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No tasks generated yet.</p> // Placeholder for when tasks are empty
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No appointments available.</p>
      )}
    </div>
  );
};

export default App;

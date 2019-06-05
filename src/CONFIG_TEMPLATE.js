// *******************
// * CONFIG TEMPLATE *
// *******************

// Instructions
// ************

// Copy this file to config.js in the same directory, add missing info, and rebuild.



export const apiKey = ""; //API Key for Google; see instructions in README
export const clientId = "";

export const darkSkyKey = ""; //Your Dark Sky Weather API key

export const secondaryLocation = "work"; // Do you commute to work, school, etc?

//Where is your house?
export const homeLatitude = 34.0672583;
export const homeLongitude = -118.3443719;

//Where is your secondary location (work/school)?
//Use Latitude and Longitude. Easiest way to get coordinates is by looking in the URL after a Google Maps Search
export const workLatitude = 38.8976763;
export const workLongitude = -77.0387185;

export const calendars = [  //Google Calendar IDs
    // The default calendar is usually your gmail address
    // However, you can add shared calendars too. Instructions in README
];

export const calendarLookAhead = 7; //Max days of events shown

export const maxEntries = 15; //Max number of events and tasks to show

export const taskLists = [ //IDs of Google Tasks lists to show. Find lists here: https://developers.google.com/tasks/v1/reference/tasklists/list
    
];

//https://developers.google.com/fit/android/data-types One of these data types to display on the mirror.
//Note: You may need to modify googleAuthScopes below depending on this. For example, you must change the Google Fit Activity scope to a Body scope for weight.
export const googleFitActivity = "com.google.step_count.delta";
//What is the above dataset called? (user-friendly name)
export const googleFitActivityUnits = "steps";

export const fitGoal = 8000; //Your fitness goal. Used for the pie chart


//      *** USUALLY DON'T NEED TO TOUCH **
export const googleAuthScopes = "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/fitness.activity.read";

//Weather
export const refreshRates = { // How often each dataset should refresh, in milliseconds
    weather: 600000, //Each weather call is 2 dark sky API calls. Dark sky currently imposes a limit of 1000 calls per day.
    fit: 900000,
    calendar: 900000, //1 Google Calendar API call, per calendar, every X milliseconds
    tasks: 900000, //1 Tasks API call, per calendar, every X milliseconds
}
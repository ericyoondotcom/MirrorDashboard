/* global gapi */

import React from "react";

import { Doughnut } from 'react-chartjs-2';
import DarkSkyApi from 'dark-sky-api';
import moment from "moment";
import {apiKey, clientId, calendars, calendarLookAhead, maxEntries, taskLists, secondaryLocation, homeLatitude, homeLongitude, workLatitude, workLongitude, darkSkyKey, googleFitActivity, googleFitActivityUnits, googleAuthScopes, fitGoal, refreshRates} from "./config";

export default class Dashboard extends React.Component {
    constructor(props){
        super(props);
        
        DarkSkyApi.apiKey = darkSkyKey;
        this.state = {
            currentTime: moment(),
            signedIn: false,
            loading: true,
            user: null,
            events: null,
            tasks: null,
            homeWeather: null,
            workWeather: null,
            fit: null
        }
        gapi.load("client:auth2", () => {
            gapi.client.init({
                apiKey,
                clientId,
                scope: googleAuthScopes
            }).then(() => {
                let authInstance = gapi.auth2.getAuthInstance();
                if(authInstance.isSignedIn.get()){
                    this.setState({signedIn: true, loading: false, user: authInstance.currentUser.get()});
                    this.fetchAll();
                }else{
                    this.setState({signedIn: false, loading: false});
                }
            });
        });

        this.setRefreshIntervals();

    }

    handleSignIn = () => {
        gapi.auth2.getAuthInstance().signIn().then((result) => {
            this.setState({signedIn: true, loading: false, user: result});
            this.fetchAll();
        });
    }

    handleSignOut = () => {
        gapi.auth2.getAuthInstance().signOut().then((result) => {
            this.setState({signedIn: false});
        });
    }

    setRefreshIntervals = () => {
        setInterval(() => {
            this.setState({currentTime: moment()});
        }, 5000);

        setInterval(() => {
            this.fetchWeather();
        }, refreshRates.weather);

        setInterval(() => {
            this.fetchCalendar();
        }, refreshRates.calendar);

        setInterval(() => {
            this.fetchFit();
        }, refreshRates.fit);

        setInterval(() => {
            this.fetchTasks();
        }, refreshRates.tasks);
    }

    fetchWeather = () => {
        const darkSkyEndpoint = "https://api.darksky.net/forecast/" + darkSkyKey + "/" + homeLatitude.toString() + "," + homeLongitude.toString();
        console.debug(darkSkyEndpoint);

        DarkSkyApi.loadCurrent({
            latitude: homeLatitude,
            longitude: homeLongitude
        }).then((result) => {
            this.setState({homeWeather: result});
        });

        DarkSkyApi.loadCurrent({
            latitude: workLatitude,
            longitude: workLongitude
        }).then((result) => {
            this.setState({workWeather: result});
        });
    }

    fetchCalendar = () => {
        const calendarRequests = calendars.map((calendarId) => {
            let now = moment();
            return gapi.client.request({
                path: "https://www.googleapis.com/calendar/v3/calendars/" + calendarId + "/events",
                method: "GET",
                params: {
                    timeMin: now.toISOString(),
                    timeMax: now.add(calendarLookAhead, "days").toISOString(),
                    singleEvents: true
                }
            });
        });
        Promise.all(calendarRequests).then((results) => {
            const events = results.map((result) => {
                return result.result.items.map((item) => {
                    return {
                        name: item.summary,
                        start: moment(item.start.dateTime),
                        end: moment(item.end.dateTime),
                        location: item.location,
                        id: item.id
                    };
                });
            }).flat().sort((a, b) => {
                return a.start.valueOf() - b.start.valueOf();
            });
            this.setState({events});
        });
    }

    fetchTasks = () => {
        const taskRequests = taskLists.map((list) => {
            return gapi.client.request({
                path: "https://www.googleapis.com/tasks/v1/lists/" + list + "/tasks",
                method: "GET",
                params: {
                    showCompleted: false,
                    maxResults: maxEntries
                }
            });
        });
        Promise.all(taskRequests).then((results) => {

            const tasks = results.map((result) => {
                if(result.result.items === undefined) return [];
                return result.result.items.map((item) => {
                    return {
                        name: item.title,
                        id: item.id,
                        //TODO: Add due date support
                        duedate: /*"due" in item ? moment(item.due).add(1, "days").local(): */null
                    };
                });
            }).flat().sort((a, b) => {
                if(a.duedate === null){
                    if(b.duedate === null){
                        return a;
                    }
                    return b;
                }
                if(b.duedate === null){
                    return a;
                }
                return a.duedate.valueOf() - b.duedate.valueOf();
            });
            this.setState({tasks});
        });
    }

    fetchFit = () => {
        gapi.client.request({
            path: "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
            method: "POST",
            body: {
                "aggregateBy": [
                  {
                    "dataTypeName": googleFitActivity
                  }
                ],
                "bucketByTime": {
                  "durationMillis": 86400000
                },
                "startTimeMillis": moment().hour(23).minute(59).second(59).millisecond(999).subtract(1, "week").valueOf(),
                "endTimeMillis": moment().hour(23).minute(59).second(59).millisecond(999).valueOf()
            }
        }).then((result) => {
            console.log(result);
            let data = result.result.bucket.map((day) => {
              if(day.dataset.length === 0){
                return 0;
              }
              return day.dataset[0].point[0].value[0].intVal; 
            });
            this.setState({fit: data});
        });
    }

    fetchAll = () => {
        this.fetchWeather();
        this.fetchCalendar();
        this.fetchTasks();
        this.fetchFit();
    }

    render(){
        if(this.state.loading){
            return (
                <div className="fullPage reflective">
                    <h1 style={{textAlign: "center", position: "relative", top: "50%", tranform: "translateY(-50vh)"}}>Loading...</h1>
                </div>
            );
        }

        if(!this.state.signedIn){
            return (
                <div className="fullPage reflective">
                    <h1 style={{textAlign: "center", position: "relative", top: "50%", tranform: "translateY(-50vh)", textDecoration: "underline", cursor: "pointer"}} onClick={this.handleSignIn}>Click to Sign In</h1>
                </div>
            );
        }

        const now = (new Date()).getHours();
        let timeOfDay;
        if(now < 4)
            timeOfDay = "night";
        else if(now < 11)
            timeOfDay = "morning";
        else if(now < 17)
            timeOfDay = "afternoon";
        else if(now < 23)
            timeOfDay = "evening";
        else
            timeOfDay = "night";

        let eventsHtml;
        if(this.state.events === null){
            eventsHtml = (
                <h2 style={{textAlign: "center", fontSize: "15px"}}>Loading...</h2>
            );
        } else if(this.state.events.length == 0){
            eventsHtml = (
                <h2 style={{textAlign: "center", fontSize: "20px"}}>Your calendar's clear for the next {maxEntries} days.</h2>
            );
        }else{
            eventsHtml = this.state.events.slice(0, maxEntries - 1).map((event, i) => {
                return (
                    <li style={{fontSize: "20px"}} key={"event-" + event.id}>{event.name} <span className="dimmed right">{event.start.fromNow()} – {event.start.calendar()}</span></li>
                );
            });
            if(maxEntries < this.state.events.length){
                eventsHtml.push(
                    <p key="hiddenEventsNotif" style={{textAlign: "center", fontSize: "15px"}}>{this.state.events.length - maxEntries} more events hidden</p>
                );
            }
        }

        let tasksHtml;
        if(this.state.tasks === null){
            tasksHtml = (
                <h2 style={{textAlign: "center", fontSize: "15px"}}>Loading...</h2>
            );
        } else if(this.state.tasks.length == 0){
            tasksHtml = (
                <h2 style={{textAlign: "center", fontSize: "15px"}}>Good job! Nothing to do.</h2>
            );
        }else{
            tasksHtml = this.state.tasks.slice(0, maxEntries - 1).map((task, i) => {
                return (
                    <li style={{fontSize: "20px"}} key={"task-" + task.id} >{task.name} <span className="dimmed right">{task.duedate === null ? "" : ("Due " + task.duedate.fromNow().toString())}</span></li>
                );
            });
            if(maxEntries < this.state.tasks.length){
                tasksHtml.push(
                    <p key="hiddenTasksNotif" style={{textAlign: "center", fontSize: "15px"}}>{this.state.tasks.length - maxEntries} more tasks hidden</p>
                );
            }
        }

        return (
            <div className="fullPage reflective">
                <table className="celled" id="main">
                    <tbody>
                        <tr>
                            <td>
                                <div className="sectionWrapper">
                                    <h1 className="sectionHeader" style={{textAlign: "center"}} onClick={this.handleSignOut}>Good {timeOfDay}, {this.state.user.getBasicProfile().getGivenName()}!</h1>
                                    <div style={{padding: "1.7vh", textAlign: "center"}}>
                                        <h2 style={{fontSize: "2vh", margin: 0}}>It's {this.state.currentTime.format("dddd, MMMM Do")}</h2>
                                        <h1 style={{fontSize: "9vh", margin: 0}}>{this.state.currentTime.format("h:mm A")}</h1>
                                    </div>
                                    <table style={{position: "relative", left: 0, right: 0, margin: "auto", border: "none", textAlign: "center"}}>
                                        <tbody>
                                            <tr>
                                                <td style={{border: "none", paddingRight: "40px"}}>
                                                    <h2 style={{fontSize: "1.6vh", margin: 0}}>HOME</h2>
                                                    <h1 style={{fontSize: "8vh", margin: 0}}>{this.state.homeWeather === null ? "..." : (Math.round(this.state.homeWeather.temperature) + "°")}</h1>
                                                    <h2 style={{fontSize: "1.6vh", margin: 0}}>{this.state.homeWeather === null ? "Loading weather" : this.state.homeWeather.summary}</h2>
                                                    <h2 style={{fontSize: "1.6vh", margin: 0}}>{this.state.homeWeather === null ? "Loading precipitation" : (this.state.homeWeather.precipProbability.toString() + "% chance precip.")}</h2>
                                                </td>
                                                <td style={{border: "none", paddingLeft: "40px"}}>
                                                    <h2 style={{fontSize: "1.6vh", margin: 0}}>{secondaryLocation.toUpperCase()}</h2>
                                                    <h1 style={{fontSize: "8vh", margin: 0}}>{this.state.workWeather === null ? "..." : (Math.round(this.state.workWeather.temperature) + "°")}</h1>
                                                    <h2 style={{fontSize: "1.6vh", margin: 0}}>{this.state.workWeather === null ? "Loading weather" : this.state.workWeather.summary}</h2>
                                                    <h2 style={{fontSize: "1.6vh", margin: 0}}>{this.state.workWeather === null ? "Loading precipitation" : (this.state.workWeather.precipProbability.toString() + "% chance precip.")}</h2>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </td>
                            <td>
                                <div className="sectionWrapper">
                                    <h1 className="sectionHeader" style={{textAlign: "center"}}>Google Fit Goals</h1>
                                    {
                                        this.state.fit === null ?
                                            (
                                                <p style={{textAlign: "center", fontSize: "15px"}}>Loading...</p>
                                            )
                                        :
                                            (
                                                <div style={{width: "100%", height: "40%", position: "relative", marginTop: "2%", }}>
                                                    <Doughnut data={{
                                                        datasets: [{
                                                            data: [
                                                                this.state.fit[this.state.fit.length - 1],
                                                                this.state.fit[this.state.fit.length - 1] > fitGoal ? 0 : (fitGoal - this.state.fit[this.state.fit.length - 1])
                                                            ],
                                                            backgroundColor: [
                                                                "white",
                                                                "black"
                                                            ]  
                                                        }],
                                                        labels: [
                                                            "Completed",
                                                            "Left to go"
                                                        ]
                                                    }}
                                                    width={9}
                                                    height={9}
                                                    options={{
                                                        title: {
                                                            display: true,
                                                            fontFamily: "'Assistant', 'Oxygen', 'Roboto', sans-serif",
                                                            fontColor: "white",
                                                            text: ["Today", this.state.fit[this.state.fit.length - 1] + " " + googleFitActivityUnits],
                                                            fontSize: 20
                                                        },
                                                        legend: {
                                                            display: false
                                                        },
                                                        maintainAspectRatio: false,
                                                        cutoutPercentage: 80
                                                    }} />
                                                    <div style={{marginTop: "2%"}} />
                                                    <table style={{position: "relative", left: 0, right: 0, margin: "auto", border: "none", textAlign: "center", height: "55%"}}>
                                                        <tbody style={{height: "100%"}}>
                                                            <tr style={{height: "100%"}}>
                                                                {
                                                                    this.state.fit.slice(0, this.state.fit.length - 1).map((val, index) => {
                                                                        return (
                                                                            <td style={{border: "none", paddingLeft: "40px", width: "15%"}}>
                                                                                <Doughnut data={{
                                                                                    datasets: [{
                                                                                        borderWidth: 1,
                                                                                        data: [
                                                                                            val,
                                                                                            val > fitGoal ? 0 : (fitGoal - val)
                                                                                        ],
                                                                                        backgroundColor: [
                                                                                            "white",
                                                                                            "black"
                                                                                        ]  
                                                                                    }],
                                                                                    labels: [
                                                                                        "Completed",
                                                                                        "Left to go"
                                                                                    ]
                                                                                }}
                                                                                width={9}
                                                                                height={9}
                                                                                options={{
                                                                                    title: {
                                                                                        display: true,
                                                                                        fontFamily: "'Assistant', 'Oxygen', 'Roboto', sans-serif",
                                                                                        fontColor: "white",
                                                                                        text: [moment().subtract(6 - index, "days").format("dddd"), val + " " + googleFitActivityUnits],
                                                                                        fontSize: 15
                                                                                    },
                                                                                    legend: {
                                                                                        display: false
                                                                                    },
                                                                                    maintainAspectRatio: false,
                                                                                    cutoutPercentage: 80
                                                                                }} />
                                                                            </td>
                                                                        );
                                                                    })
                                                                }
                                                                
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )
                                    }
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div className="sectionWrapper">
                                    <h1 className="sectionHeader" style={{textAlign: "center"}}>Events</h1>
                                    <ul style={{margin: "0 20%", fontSize: "1.7vh", padding: 0}}>
                                        {eventsHtml}
                                    </ul>
                                </div>
                            </td>
                            <td>
                                <div className="sectionWrapper">
                                    <h1 className="sectionHeader" style={{textAlign: "center"}}>Tasks</h1>
                                    <ul style={{margin: "0 20%", fontSize: "1.7vh", padding: 0}}>
                                        {tasksHtml}
                                    </ul>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

}
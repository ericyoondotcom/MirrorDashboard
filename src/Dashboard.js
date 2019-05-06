/* global gapi */

import React from "react";
import { relative } from "path";

import request from "request";
import moment from "moment";
import {apiKey, clientId, calendars, calendarLookAhead, maxEntries, taskLists, secondaryLocation, homeLatitude, homeLongitude, workLatitude, workLongitude, darkSkyKey} from "./config";

export default class Dashboard extends React.Component {
    constructor(props){
        super(props);
        moment().format();
        this.state = {
            currentTime: moment(),
            signedIn: false,
            loading: true,
            user: null,
            events: null,
            tasks: null
        }
        gapi.load("client:auth2", () => {
            console.log("client loaded");
            gapi.client.init({
                apiKey,
                clientId,
                scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly"
            }).then(() => {
                console.log("gapi initted");
                let authInstance = gapi.auth2.getAuthInstance();
                if(authInstance.isSignedIn.get()){
                    this.setState({signedIn: true, loading: false, user: authInstance.currentUser.get()});
                    this.fetchData();
                }else{
                    this.setState({signedIn: false, loading: false});
                }
            });
        });
        
        setInterval(() => {
            this.setState({currentTime: moment()});
        }, 5000);

    }

    handleSignIn = () => {
        gapi.auth2.getAuthInstance().signIn().then((result) => {
            this.setState({signedIn: true, loading: false, user: result});
            this.fetchData();
        });
    }

    handleSignOut = () => {
        gapi.auth2.getAuthInstance().signOut().then((result) => {
            this.setState({signedIn: false});
        });
    }

    fetchData = () => {
        
        request.get("https://api.darksky.net/forecast/" + darkSkyKey + "/" + homeLatitude.toString() + "," + homeLongitude.toString(), (err, resp, body) => {
            console.error(err);
            console.log(body);
        });

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
                        location: item.location
                    };
                });
            }).flat().sort((a, b) => {
                return a.start.valueOf() - b.start.valueOf();
            });
            this.setState({events});
        });

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
            console.log(results);
            const tasks = results.map((result) => {
                if(result.result.items === undefined) return [];
                return result.result.items.map((item) => {
                    return {
                        name: item.title,
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
                <h2 style={{textAlign: "center", fontSize: "15px"}}>Your calendar's clear for the next {maxEntries} days.</h2>
            );
        }else{
            eventsHtml = this.state.events.slice(0, maxEntries - 1).map((event, i) => {
                return (
                    <li>{event.name} <span className="dimmed right">{event.start.fromNow()} – {event.start.calendar()}</span></li>
                );
            });
            if(maxEntries < this.state.events.length){
                eventsHtml.push(
                    <p style={{textAlign: "center", fontSize: "15px"}}>{this.state.events.length - maxEntries} more events hidden</p>
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
                    <li>{task.name} <span className="dimmed right">{task.duedate === null ? "" : ("Due " + task.duedate.fromNow().toString())}</span></li>
                );
            });
            if(maxEntries < this.state.tasks.length){
                tasksHtml.push(
                    <p style={{textAlign: "center", fontSize: "15px"}}>{this.state.tasks.length - maxEntries} more events hidden</p>
                );
            }
        }

        return (
            <div className="fullPage reflective">
                <table className="celled" id="main">
                    <tr>
                        <td>
                            <div className="sectionWrapper">
                                <h1 className="sectionHeader" style={{textAlign: "center"}} onClick={this.handleSignOut}>Good {timeOfDay}, {this.state.user.getBasicProfile().getGivenName()}!</h1>
                                <div style={{padding: "1.7vh", textAlign: "center"}}>
                                    <h2 style={{fontSize: "2vh", margin: 0}}>It's {this.state.currentTime.format("dddd, MMMM Do")}</h2>
                                    <h1 style={{fontSize: "9vh", margin: 0}}>{this.state.currentTime.format("h:mm A")}</h1>
                                </div>
                                <table style={{position: "relative", left: 0, right: 0, margin: "auto", border: "none", textAlign: "center"}}>
                                    <tr>
                                        <td style={{border: "none", paddingRight: "40px"}}>
                                            <h2 style={{fontSize: "1.6vh", margin: 0}}>HOME</h2>
                                            <h1 style={{fontSize: "8vh", margin: 0}}>75°</h1>
                                        </td>
                                        <td style={{border: "none", paddingLeft: "40px"}}>
                                            <h2 style={{fontSize: "1.6vh", margin: 0}}>{secondaryLocation.toUpperCase()}</h2>
                                            <h1 style={{fontSize: "8vh", margin: 0}}>73°</h1>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                        <td>
                            <div className="sectionWrapper">
                                <h1 className="sectionHeader" style={{textAlign: "center"}}>Google Fit Goals</h1>
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
                </table>
            </div>
        );
    }

}
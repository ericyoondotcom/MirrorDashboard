/* global gapi */

import React from "react";
import { relative } from "path";

import moment from "moment";
import {apiKey, clientId, calendars, calendarLookAhead, maxEvents} from "./config";

export default class Dashboard extends React.Component {
    constructor(props){
        super(props);
        moment().format();
        this.state = {
            signedIn: false,
            loading: true,
            user: null,
            events: null
        }
        gapi.load("client:auth2", () => {
            console.log("client loaded");
            gapi.client.init({
                apiKey,
                clientId,
                scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly"
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
            console.log(results);
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
            console.log(events);
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
                <h2 style={{textAlign: "center", fontSize: "15px"}}>Nothing's on your calendar for the next {maxEvents} days.</h2>
            );
        }else{
            eventsHtml = this.state.events.slice(0, maxEvents - 1).map((event, i) => {
                return (
                    <li>{event.name} <span className="dimmed right">{event.start.fromNow()}</span></li>
                );
            })
        }

        return (
            <div className="fullPage reflective">
                <table className="celled" id="main">
                    <tr>
                        <td>
                            <div className="sectionWrapper">
                                <h1 className="sectionHeader" style={{textAlign: "center"}} onClick={this.handleSignOut}>Good {timeOfDay}, {this.state.user.getBasicProfile().getGivenName()}!</h1>
                                <div style={{marginTop: "10%"}} />
                                <table style={{position: "relative", left: 0, right: 0, margin: "auto", border: "none", textAlign: "center"}}>
                                    <tr>
                                        <td style={{border: "none", padding: "40px"}}>
                                            <h2 style={{fontSize: "20px", margin: 0}}>HOME</h2>
                                            <h1 style={{fontSize: "100px", margin: 0}}>75°</h1>
                                        </td>
                                        <td style={{border: "none", padding: "40px"}}>
                                            <h2 style={{fontSize: "20px", margin: 0}}>WORK</h2>
                                            <h1 style={{fontSize: "100px", margin: 0}}>73°</h1>
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
                                <ul style={{margin: "0 20%", fontSize: "25px", padding: 0}}>
                                    {eventsHtml}
                                </ul>
                            </div>
                        </td>
                        <td>
                            <div className="sectionWrapper">
                                <h1 className="sectionHeader" style={{textAlign: "center"}}>Tasks</h1>
                                <ul style={{margin: "0 20%", fontSize: "25px"}}>
                                    <li>Do something <span className="dimmed right">Due tomorrow</span></li>
                                    <li>Do something else <span className="dimmed right">Due in 2 days</span></li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
        );
    }

}
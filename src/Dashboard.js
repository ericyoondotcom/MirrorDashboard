/* global gapi */

import React from "react";
import { relative } from "path";

import moment from "moment";
import {apiKey, clientId, calendars, calendarLookAhead} from "./config";

export default class Dashboard extends React.Component {
    constructor(props){
        super(props);
        moment().format();
        this.state = {
            signedIn: false,
            loading: true,
            user: null,
            events: []
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
        let now = moment();
        const calendarRequests = calendars.map((calendarId) => {
            return gapi.client.request({
                path: "https://www.googleapis.com/calendar/v3/calendars/" + calendarId + "/events",
                method: "GET",
                params: {
                    timeMin: now.toISOString(),
                    timeMax: now.add(calendarLookAhead, "days").toISOString()
                }
            });
        });
        Promise.all(calendarRequests).then((results) => {
            console.log(results);
            const events = results.map((result) => {
                return result.items
                //TODO: Process data
            }).flat();
            this.setState({events});
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

        return (
            <div className="fullPage reflective">
                <table style={{width: "100%", height: "100%"}} className="celled">
                    <tr style={{height: "50%"}}>
                        <td style={{width: "50%", position: "relative"}}>
                            <h1 className="sectionHeader" style={{textAlign: "center"}} onClick={this.handleSignOut}>Good {timeOfDay}, {this.state.user.getBasicProfile().getGivenName()}!</h1>
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
                        </td>
                        <td style={{width: "50%", position: "relative"}}>
                            <h1 className="sectionHeader" style={{textAlign: "center"}}>Google Fit Goals</h1>
                        </td>
                    </tr>
                    <tr style={{height: "50%"}}>
                        <td style={{width: "50%", position: "relative"}}>
                            <h1 className="sectionHeader" style={{textAlign: "center"}}>Today's Events</h1>
                            <ul style={{margin: "0 20%", fontSize: "25px"}}>
                                <li>A meeting <span className="dimmed right">In 2 hours</span></li>
                                <li>Another event <span className="dimmed right">Tomorrow</span></li>
                            </ul>
                        </td>
                        <td style={{width: "50%", position: "relative"}}>
                            <h1 className="sectionHeader" style={{textAlign: "center"}}>Tasks</h1>
                            <ul style={{margin: "0 20%", fontSize: "25px"}}>
                                <li>Do something <span className="dimmed right">Due tomorrow</span></li>
                                <li>Do something else <span className="dimmed right">Due in 2 days</span></li>
                            </ul>
                        </td>
                    </tr>
                </table>
            </div>
        );
    }

}
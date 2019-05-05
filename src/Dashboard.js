import React from "react";
import { relative } from "path";

export default class Dashboard extends React.Component {
    constructor(props){
        super(props);
    }

    render(){
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
                            <h1 className="sectionHeader" style={{textAlign: "center"}}>Good {timeOfDay}, Person!</h1>
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
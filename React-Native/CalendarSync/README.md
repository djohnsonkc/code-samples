Calendar Sync Helper for React Native
------------------

This is an example of helper class for react-native-calendar-events to create custom calendar entries in a user's calendar. This solution isn't perfect,
but I thought it might help others that trying to use react-native-calendar-events.

In the example below, the 3rd parameter is a function that I use as a status "emitter" that I'm using to have some awareness of what is happening within the the nested asynchronous calls that are happening.

CalendarSync.PerformSync handles all of the various things that need to occur when inserting custom 
calendar entries. This implementation deletes all of the custom calendar entries 
each time the list needs to be refreshed. Seems to perform well on various models and OS versions of iOS and Android devices.

TODO: Use async waterfall to wrangle all of the async calls a bit better, making the code more readable and manageable, and avoid callback "hell".


Code Sample
------------------

import { CalendarSync } from '../../Helpers/CalendarSync'

CalendarSync.PerformSync("add", customEvents, function(err, status) {

    if(err) {
        console.log("statusEmitter ERROR", JSON.stringify(err, null, 2))
    }
    else {
        console.log("statusEmitter", JSON.stringify(status, null, 2))
    }
    

}, function(err, finalResponse){

    if(err) {
        console.log("PerformSync ERROR", JSON.stringify(err, null, 2))
    }
    else {
        console.log("PerformSync", JSON.stringify(finalResponse, null, 2))
    }

})



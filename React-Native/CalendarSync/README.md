Calendar Sync Helper for React Native v0.61.4
------------------

This is an example of a helper class for **react-native-calendar-events** to create custom calendar entries in a user's calendar. This solution isn't perfect, but I thought this example might help others that are learning how to use react-native-calendar-events with **React Native v0.61.4** and **auto-linking**.

In the example below, the 3rd parameter is a function that I use as a status "emitter" that echoes back what is happening within the the nested asynchronous calls.

CalendarSync.PerformSync handles all of the various things that need to occur when inserting custom 
calendar entries such as authorization, creation of a custom calendar, and the removal and re-insertion of custom events. This implementation deletes all of the custom calendar entries 
each time the list needs to be refreshed. Things seem to perform well on various models and OS versions of iOS and Android devices.

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



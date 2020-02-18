import { Platform } from 'react-native'

import RNCalendarEvents from 'react-native-calendar-events';

import moment from 'moment'

export var CalendarSync = {

    // possible values: denied, restricted, authorized or undetermined
    // STATUS_ENUMS: {
    //     AUTHORIZED: 'authorized',
    //     DENIED: 'denied',
    //     RESTRICTED: 'restricted',
    //     UNDETERMINED: 'undetermined'
    // },

    STATUS: null,
    CALENDARS: [],
    MYAPP_CALENDAR: null,
    EVENTS: [],


    PerformSync: function(action, customEvents, statusEmitter, callback) {

        //****************************************************
        // Check if user has authorized access to their calendar
        //****************************************************

        // NOTE: statusEmitter is shared with other functions as they are called

        CalendarSync.Authorize(statusEmitter, function(err, status){

            if(err) {
                callback(err, null)
            }
            else {

                if(status === 'authorized') {

                    CalendarSync.FindCalendars(statusEmitter, function(err, calendars){

                        if(err) {
                            callback(err, null)
                        }
                        else {

                            if(statusEmitter) statusEmitter(null, {  message: "Calling CalendarSync.GetCalendarEvents..." })

                            CalendarSync.GetCalendarEvents(calendars.calendars, statusEmitter, function(err, events){

                                if(err) {
                                    callback(err, null)
                                }
                                else {

																	  // delete all from calendar before reinserting...
                                    CalendarSync.DeleteMyAppEvents(events.myAppEvents, statusEmitter, function(err, resp){

                                        if(err) {
                                            callback(err, null)
                                        }
                                        else {
																					
																					// this allows the myApp calendar entries to be removed
																					if(action === "delete-all") {
																						callback(null, resp)
																					}
																					else {

																						// re-insert shifts...
                                            CalendarSync.AddMyAppEvents(calendars, customEvents, statusEmitter, function(err, resp){

                                                if(err) {
                                                    callback(err, null)
                                                }
                                                else {
                                                    callback(null, resp)
                                                }

                                            })
																					}


                                        }

                                    })



                                }


                            })


                        }
                        

                    })
                }
                else {
                    callback( { error: 'Not authorized' }, null)
                }

            }

        })



    },

    Authorize: function(statusEmitter, callback) {

        if(statusEmitter) statusEmitter(null, { message: "RNCalendarEvents.authorizationStatus()...", status: '?' })


        RNCalendarEvents.authorizationStatus()
        .then((status) => {

            // possible values: denied, restricted, authorized or undetermined

            if(statusEmitter) statusEmitter(null, { message: "RNCalendarEvents.authorizationStatus", status: status })
            
            CalendarSync.STATUS = status
        

            // ONLY if undertermined, should we ask for permission
            // user may later set to denied under device Settings->MyApp
            // if(status !== 'undetermined') {

                if(statusEmitter) statusEmitter(null, { message: "RNCalendarEvents.authorizeEventStore()..." })
                
                RNCalendarEvents.authorizeEventStore()
                .then((status) => {

                    CalendarSync.STATUS = status
                    
                    if(statusEmitter) statusEmitter(null, { message: "Did user authorize?", status: status })

                    callback(null, status)

                })
                .catch(err => {
                    if(statusEmitter) statusEmitter(err, null)
                    callback(err, null)
                });

            // }
            // else {
            //     if(statusEmitter) statusEmitter(null, { message: "User has already authorized.", status: status })
            //     callback(null, status)

            // }

            
        })

    },

    CreateMyAppCalendar: function(statusEmitter, callback) {
        
        let request = {
            title: 'MyApp',
            color: '#31B0D5',
            entityType: 'event',
            name: 'MyApp',
            accessLevel: 'owner',
            ownerAccount: 'MyApp',
            source: {
                name: 'MyApp',
                type: 'LOCAL',
                isOwnerAccount: true
            }
        }

        RNCalendarEvents.saveCalendar(request)
        .then((calendar) => {

            CalendarSync.MYAPP_CALENDAR = calendar
            
            if(statusEmitter) statusEmitter(null, { message: "MyApp Calendar Created", calendar: calendar })

            callback(null, calendar)

        })
        .catch(err => {
            if(statusEmitter) statusEmitter(err, null)
            callback(err, null)
        });

    },

    FindCalendars: function(statusEmitter, callback) {

        if(statusEmitter) statusEmitter(null, { message: "FindCalendars..."})
        

        RNCalendarEvents.findCalendars()
        .then((calendars) => {


            if(statusEmitter) statusEmitter(null, {  message: "Found calendars", calendars: calendars })

            CalendarSync.CALENDARS = calendars

            let myAppCalendar = calendars.find(function(item){
                return item.title === 'MyApp'
            })

            if(myAppCalendar) {
                
                if(statusEmitter) statusEmitter(null, { message: "Found MyApp Calendar", myAppCalendar: myAppCalendar })

                CalendarSync.MYAPP_CALENDAR = myAppCalendar

                callback(null, { calendars: calendars, myAppCalendar: myAppCalendar })
            }
            else {

                if(statusEmitter) statusEmitter(null, { message: "Creating MyApp Calendar" })

                CalendarSync.CreateMyAppCalendar(statusEmitter, function(err, newCalendar){

                    if(err) {
                        callback(err, null)
                    }
                    else {

                        if(statusEmitter) statusEmitter(null, { message: "Created MyApp Calendar", myAppCalendar: newCalendar })

                        CalendarSync.MYAPP_CALENDAR = newCalendar

                        callback(null, { calendars: calendars, myAppCalendar: newCalendar })
                    }
                })
            }
            

        })
        .catch(err => {
            if(statusEmitter) statusEmitter(err, null)
            callback(err, null)
        });


    },


    GetCalendarEvents: function(calendars, statusEmitter, callback) {

        // next 30 days only - use this specific format
        const startDate = moment(new Date()).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')  
        const endDate = moment(new Date()).add(30,'days').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]') 

        if(statusEmitter) statusEmitter(null, {  message: "GetCalendarEvents...", startDate: startDate, endDate, endDate, calendars: calendars })

				let calendarIds = []
				calendars.forEach(function(item){
					calendarIds.push(item.id)
				})

        RNCalendarEvents.fetchAllEvents(startDate, endDate, calendarIds)
        .then((events) => {

						console.log("all events", events)
            let myAppEvents  = events.filter(item => item.title.toLowerCase().indexOf('myApp:') !== -1);

            CalendarSync.EVENTS = myAppEvents || []
            
            if(statusEmitter) statusEmitter(null, {  message: "All Events", events: events, myAppEvents: myAppEvents })

            // use return here because .catch() seems to fire even when successful
            callback(null, {  message: "All Events", events: events, myAppEvents: myAppEvents })

        })
        .catch(err => {
            if(statusEmitter) statusEmitter({ message: "fetchAllEvents ERROR", error: err }, null)
            return callback(err, null)
        });



    },

    AddMyAppEvents: function(calendars, customEvents, statusEmitter, callback) {

        let isAndroid = () => Platform.OS.toUpperCase() === 'ANDROID'

        let myAppCalendarId = calendars.myAppCalendar.id

        customEvents.forEach(function(s){

            s.data.forEach(function(shift){


							let title = 'MyApp Custom Title'

							let settings = {
									calendarId: myAppCalendarId,
									startDate: moment(shift.shift_Begin).toISOString(),
									endDate: moment(shift.shift_End).toISOString(),
									location: shift.location_Name
							}
							// android providers "description" NOT "notes"
							if(isAndroid) {
									settings.description = shift.event_desc
							}
							else {
									settings.notes = shift.event_desc
							}

							RNCalendarEvents.saveEvent(title, settings) 
								
					

            })

        })

        callback(null, { message: 'Added MyApp events to calendar.'})


    },

    DeleteMyAppEvents: function(myAppEvents, statusEmitter, callback) {

        myAppEvents.forEach(function(event){
            RNCalendarEvents.removeEvent(event.id)
            .then((item) => {


                if(statusEmitter) statusEmitter(null, {  message: "Deleted Event", event: item })


            })
            .catch(err => {
                if(statusEmitter) statusEmitter({ message: "DeleteMyAppEvents ERROR", error: err }, null)
                return callback(err, null)
            })

        })

        callback(null, { message: "Deleted all MyApp events." })


    }




}
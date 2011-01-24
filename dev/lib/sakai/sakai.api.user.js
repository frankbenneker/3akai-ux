/**
 *
 * Licensed to the Sakai Foundation (SF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The SF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 *
 */


/**
 * @class User
 *
 * @description
 * Advanced user related functionality, especially common actions
 * that originate from a logged in user. This should only hold functions which
 * are used across multiple pages, and does not constitute functionality related
 * to a single area/page
 *
 * @namespace
 * Advanced user related functionality, especially common actions
 * that originate from a logged in user.
 */
define(["jquery",
        "sakai/sakai.api.server",
        "sakai/sakai.api.l10n",
        "sakai/sakai.api.i18n",
        "sakai/sakai.api.util",
        "/dev/configuration/config.js"],
        function($, sakai_serv, sakai_l10n, sakai_i18n, sakai_util, sakai_conf) {

    return {
        data : {
            me: {}
        },
        /**
         * @param {Object} extraOptions can include recaptcha: {challenge, response}, locale : "user_LOCALE", template: "templateName"
         */
        createUser : function(username, firstName, lastName, email, password, passwordConfirm, extraOptions, callback) {
            var profileData = {}; profileData.basic = {}; profileData.basic.elements = {};
            profileData.basic.elements["firstName"] = {};
            profileData.basic.elements["firstName"].value = firstName;
            profileData.basic.elements["lastName"] = {};
            profileData.basic.elements["lastName"].value = lastName;
            profileData.basic.elements["email"] = {};
            profileData.basic.elements["email"].value = email;
            profileData["email"] = email;
            profileData.basic.access = "everybody";
            var user = {
                "_charset_": "utf-8",
                "locale": sakai_l10n.getUserDefaultLocale(),
                "pwd": password,
                "pwdConfirm": passwordConfirm,
                "email": email,
                ":name": username,
                ":sakai:pages-template": "/var/templates/site/" + sakai_conf.defaultUserTemplate,
                ":sakai:profile-import": $.toJSON(profileData)
            };
            for (var i in extraOptions) {
                if (extraOptions.hasOwnProperty(i)) {
                    switch(i) {
                        case "recaptcha":
                            user[":create-auth"] = "reCAPTCHA.net";
                            user[":recaptcha-challenge"] = extraOptions[i].challenge;
                            user[":recaptcha-response"] = extraOptions[i].response;
                            break;
                        case "locale":
                            user["locale"] = extraOptions[i];
                            break;
                        case "template":
                            user["template"] = "/var/templates/site/" + extraOptions[i];
                            break;
                        default:
                            break;
                    }
                }
            }
            // Send an Ajax POST request to create a user
            $.ajax({
                url: sakai_conf.URL.CREATE_USER_SERVICE,
                type: "POST",
                data: user,
                success: function(data){

                    // Call callback function if set
                    if ($.isFunction(callback)) {
                        callback(true, data);
                    }

                },
                error: function(xhr, textStatus, thrownError){

                    // Call callback function if set
                    if ($.isFunction(callback)) {
                        callback(false, xhr);
                    }

                }
            });
        },


        /**
         * Remove the user credentials in the Sakai3 system.
         * Note that this doesn't actually remove the user, only its permissions.
         *
         * @example
         * sakai.api.User.createUser({
         *     "firstName": "User",
         *     "lastName": "0",
         *     "email": "user.0@sakatest.edu",
         *     "pwd": "test",
         *     "pwdConfirm": "test",
         *     ":name": "user0"
         * });
         *
         * @param {String} userid The id of the user you want to remove from the system
         * @param {Function} [callback] A callback function which will be called after the request to the server.
         */
        removeUser : function(userid, callback){

            // Send an Ajax POST request to remove a user
            $.ajax({
                url: "/system/userManager/user/" + userid + ".delete.json",
                type: "POST",
                success: function(data){

                    // Call callback function if set
                    if ($.isFunction(callback)) {
                        callback(true, data);
                    }

                },
                error: function(xhr, textStatus, thrownError){

                    // Call callback function if set
                    if ($.isFunction(callback)) {
                        callback(false, xhr);
                    }

                }
            });

        },

        /**
         * Log-in to Sakai3
         *
         * @example
         * sakai.api.user.login({
         *     "username": "user1",
         *     "password": "test"
         * });
         *
         * @param {Object} credentials JSON object container the log-in information. Contains the username and password.
         * @param {Function} [callback] Callback function that is called after sending the log-in request to the server.
         */
        login : function(credentials, callback) {

            // Argument check
            if (!credentials || !credentials.username || !credentials.password) {
                debug.info("sakai.api.user.login: Not enough or invalid arguments!");
                callback(false, null);
                return;
            }

            /*
             * sakaiauth:un : the username for the user
             * sakaiauth:pw : the password for the user
             * sakaiauth:login : set to 1 because we want to perform a login action
             */
            var data = {
                "sakaiauth:login": 1,
                "sakaiauth:un": credentials.username,
                "sakaiauth:pw": credentials.password,
                "_charset_": "utf-8"
            };

            // Send the Ajax request
            $.ajax({
                url : sakai_conf.URL.LOGIN_SERVICE,
                type : "POST",
                success: function(data){

                    // Call callback function if set
                    if ($.isFunction(callback)) {
                        callback(true, data);
                    }

                },
                error: function(xhr, textStatus, thrownError){

                    // Call callback function if set
                    if ($.isFunction(callback)) {
                        callback(false, xhr);
                    }

                },
                data : data
            });

        },


        /**
         * Log-out from Sakai3
         *
         * @example sakai.api.user.logout();
         * @param {Function} [callback] Callback function that is called after sending the log-in request to the server.
         */
        logout : function(callback) {

            /*
             * POST request to the logout service,
             * which will destroy the session.
             */
            $.ajax({
                url: sakai_conf.URL.PRESENCE_SERVICE,
                type: "POST",
                data: {
                    "sakai:status": "offline",
                    "_charset_": "utf-8"
                },
                complete: function(xhr, textStatus) {
                    // hit the logout service to destroy the session
                    $.ajax({
                        url: sakai_conf.URL.LOGOUT_SERVICE,
                        type: "GET",
                        complete: function(xhrInner, textStatusInner) {
                            callback(textStatusInner === "success");
                        }
                    });
                }
            });

        },


        /**
         * Retrieves all available information about a logged in user and stores it under this.data.me object. When ready it will call a specified callback function
         *
         * @param {Function} [callback] A function which will be called when the information is retrieved from the server.
         * The first argument of the callback is a boolean whether it was successful or not, the second argument will contain the retrieved data or the xhr object
         * @return {Void}
         */
        loadMeData : function(callback) {
            console.log("loadMeData", sakai_conf);
            // Get the service url from the config file
            var data_url = sakai_conf.config.URL.ME_SERVICE;
            debug.log("data_url", data_url);
            // Start a request to the service
            $.ajax({
                url: data_url,
                cache: false,
                success: function(data) {
                    console.log("success");
                    this.data.me = sakai_serv.convertObjectToArray(data, null, null);

                    // Check for firstName and lastName property - if not present use "rep:userId" for both (admin for example)
                    if (getProfileBasicElementValue(this.data.me.profile, "firstName") === "") {
                        setProfileBasicElementValue(this.data.me.profile, "firstName", this.data.me.profile["rep:userId"]);
                    }
                    if (getProfileBasicElementValue(this.data.me.profile, "lastName") === "") {
                        setProfileBasicElementValue(this.data.me.profile, "lastName", this.data.me.profile["rep:userId"]);
                    }

                    // Parse the directory locations
                    var directory = [];
                    if(this.data.me.profile && this.data.me.profile["sakai:tags"]){
                        directory = sakai_util.getDirectoryTags(this.data.me.profile["sakai:tags"].toString());
                        this.data.me.profile.saveddirectory = directory;
                    }

                    // Call callback function if set
                    if ($.isFunction(callback)) {
                        callback(true, this.data.me);
                    }
                },
                error: function(xhr, textStatus, thrownError) {
                    console.log("error");
                    // Log error
                    debug.error("sakai.api.User.loadMeData: Could not load logged in user data from the me service!");

                    if (xhr.status === 500 && window.location.pathname !== "/dev/500.html"){
                        document.location = "/dev/500.html";
                    }

                    // Call callback function if set
                    if ($.isFunction(callback)) {
                        callback(false, xhr);
                    }
                }
            });
        },



        /**
         * Retrieves the display name to use for the user from config
         * and parses it from the profile elements
         *
         * @param {Object} profile the user's profile (this.data.me.profile for the current user)
         * @return {String} the name to show for a user
         */
        getDisplayName : function(profile) {
            var configDisplayName = [sakai_conf.Profile.userNameDisplay, sakai_conf.Profile.userNameDefaultDisplay];
            var nameToReturn = "";
            var done = false;
            var idx = 0;

            var parseName = function(i,key) {
                if (profile &&
                    profile.basic &&
                    profile.basic.elements &&
                    profile.basic.elements[key] !== undefined &&
                    profile.basic.elements[key].value !== undefined) {
                   nameToReturn += profile.basic.elements[key].value + " ";
                   done = true;
               }
            };

            // iterate over the configDisplayName object until a valid non-empty display name is found
            while (!done && idx < 2) {
                if (configDisplayName[idx] !== undefined && configDisplayName[idx] !== "") {
                    var configEltsArray = configDisplayName[idx].split(" ");
                    $(configEltsArray).each(parseName);
                }
                idx++;
            }

            return unescape(sakai_util.Security.saneHTML($.trim(nameToReturn)));
        },

        /**
         * Safely retrieves an element value from the user's profile
         *
         * @param {Object} profile the user's profile (this.data.me.profile for the current user)
         * @param {String} eltName the element name to retrieve the value for
         * @return {String} the value of the element name provided
         */
        getProfileBasicElementValue : function(profile, eltName) {
            var ret = "";
            if (profile !== undefined &&
                profile.basic !== undefined &&
                profile.basic.elements !== undefined &&
                profile.basic.elements[eltName] !== undefined &&
                profile.basic.elements[eltName].value !== undefined) {
                    ret = profile.basic.elements[eltName].value;
                }
            return unescape(sakai_util.Security.saneHTML($.trim(ret)));
        },

        /**
         * Sets a value to the user's basic profile information
         *
         * @param {Object} profile the user's profile (this.data.me.profile for the current user)
         * @param {String} eltName the element name to retrieve the value for
         * @param {String} eltValue the value to place in the element
         */
        setProfileBasicElementValue : function(profile, eltName, eltValue) {
            if (profile !== undefined &&
                profile.basic !== undefined &&
                profile.basic.elements !== undefined &&
                profile.basic.elements[eltName] !== undefined) {

                profile.basic.elements[eltName].value = eltValue;
            }
        },

        /**
         * Get a user's short description from their profile
         * This is based off of the configuration in config.js
         * Example: "${role} in ${department}" could translate to "Undergraduate Student in Computer Science"
         *           based on the configuration in config.js and the user's profile information
         * If the user doesn't have the profile information requested by config.js, the function
         * will remove the token from the string and any modifiers before the token after the previous token
         * In the above example, if the user only had a department, the resulting string would be "Computer Science"
         *
         * @param {Object} profile The user's profile to get a description from
         * @return {String} the user's short description
         */
        getShortDescription : function(profile) {
            var shortDesc = sakai_conf.Profile.shortDescription || "";
            var tokenRegex = /\$\{[A-Za-z]+\}/gi;
            var tokens = shortDesc.match(tokenRegex);
            var lastReplacementValue = "";
            $(tokens).each(function(i, val) {
                var profileNode = val.match(/[A-Za-z]+/gi)[0];
                if (profile.basic.elements[profileNode] && $.trim(profile.basic.elements[profileNode].value) !== "") {
                    /*if (lastReplacementValue === "" && tokens[i-1]) {
                        // replace everything before this and after the last token
                    } */
                    if (sakai_conf.Profile.configuration.defaultConfig.basic.elements[profileNode].type === "select") {
                        lastReplacementValue = profile.basic.elements[profileNode].value;
                        lastReplacementValue = sakai_conf.Profile.configuration.defaultConfig.basic.elements[profileNode].select_elements[lastReplacementValue];
                        lastReplacementValue = sakai_i18n.General.process(lastReplacementValue, sakai_i18n.data.localBundle, sakai_i18n.data.defaultBundle);
                    } else {
                        lastReplacementValue = profile.basic.elements[profileNode].value;
                    }

                    shortDesc = shortDesc.replace(val, lastReplacementValue);
                } else {
                    if (tokens[i-1]) { // this is not the first time through
                        var indexToStart = 0;
                        // if the previous token's replaced value exists
                        if (lastReplacementValue !== "" && shortDesc.indexOf(shortDesc.indexOf(lastReplacementValue)) !== -1) {
                            // the index to start replacing at is the end of the last replacement
                            indexToStart = shortDesc.indexOf(shortDesc.indexOf(lastReplacementValue)) + lastReplacementValue.length;
                        }
                        var indexToEnd = shortDesc.indexOf(val) + val.length;
                        shortDesc = $.trim(shortDesc.replace(shortDesc.substring(indexToStart, indexToEnd), ""));
                    } else {
                        shortDesc = $.trim(shortDesc.replace(val, ""));
                    }
                }
            });
            return $.trim(shortDesc);
        },

        getContacts : function(callback) {
            if (this.data.me.mycontacts) {
                if ($.isFunction(callback)) {
                    callback();
                }
            } else {
                // has to be synchronous
                $.ajax({
                    url: sakai_conf.URL.SEARCH_USERS_ACCEPTED,
                    data: {"q": "*"},
                    async: false,
                    success: function(data) {
                        this.data.me.mycontacts = data.results;
                        if ($.isFunction(callback)) {
                            callback();
                        }
                    }
                });
            }
        },

        checkIfConnected : function(userid) {
            var ret = false;
            getContacts(function() {
                for (var i in this.data.me.mycontacts) {
                    if (i && this.data.me.mycontacts.hasOwnProperty(i)) {
                        if (this.data.me.mycontacts[i].user === userid) {
                            ret = true;
                        }
                    }
                }
            });
            return ret;
        },

        parseDirectory : function(){
        	var obj = {"elements":[]};
            for (var i in sakai.profile.main.data["sakai:tags"]){
                if (sakai.profile.main.data["sakai:tags"].hasOwnProperty(i)) {
                    var tag = sakai.profile.main.data["sakai:tags"][i];
                    if (tag.substring(0, 10) === "directory/") {
                        var finalTag = "";
                        var split = tag.split("/");
                        for (var ii = 1; ii < split.length; ii++) {
                            finalTag += sakai_util.getValueForDirectoryKey(split[ii]);
                            if (ii < split.length - 1) {
                                finalTag += "<span class='profilesection_location_divider'>&raquo;</span>";
                            }
                        }
                        obj.elements.push({
                            "locationtitle": {
                                "value": tag,
                                "title": finalTag
                            },
                            "id": {
                                "display": false,
                                "value": "" + Math.round(Math.random() * 1000000000)
                            }
                        });
                    }
                }
            }
            return obj;
        },

        /**
         * Adds system tour progress for the user to be tracked by the systemtour widget
         *
         * @param {String} type The type of progress the user as achieved
         */
        addUserProgress : function(type) {
            if (!this.data.me.profile.userprogress){
                this.data.me.profile.userprogress = {};
            }
            var me = this.data.me;
            var progressData = "";
            var refresh = true;

            switch(type) {
                case "uploadedProfilePhoto":
                    if (!me.profile.userprogress.uploadedProfilePhoto) {
                        progressData = {"uploadedProfilePhoto": true};
                        this.data.me.profile.userprogress.uploadedProfilePhoto = true;
                    }
                    break;
                case "uploadedContent":
                    if (!me.profile.userprogress.uploadedContent) {
                        progressData = {"uploadedContent": true};
                        this.data.me.profile.userprogress.uploadedContent = true;
                    }
                    break;
                case "sharedContent":
                    if (!me.profile.userprogress.sharedContent) {
                        progressData = {"sharedContent": true};
                        this.data.me.profile.userprogress.sharedContent = true;
                    }
                    break;
                case "madeContactRequest":
                    if (!me.profile.userprogress.madeContactRequest) {
                        progressData = {"madeContactRequest": true};
                        this.data.me.profile.userprogress.madeContactRequest = true;
                    }
                    break;
                case "halfCompletedProfile":
                    if (!me.profile.userprogress.halfCompletedProfile) {
                        progressData = {"halfCompletedProfile": true};
                        this.data.me.profile.userprogress.halfCompletedProfile = true;
                    }
                    break;
                default:
                    break;
            }

            if (progressData !== ""){
                var authprofileURL = "/~" + me.user.userid + "/public/authprofile/userprogress";
                sakai_serv.saveJSON(authprofileURL, progressData, function(success, data){
                    // Check whether save was successful
                    if (success && refresh) {
                        // Refresh the widget
                        $(window).trigger("sakai-systemtour-update");
                    }
                });
            }
        },

        /**
         * Checks system tour progress for the user and display tooltip reminders
         */
        checkUserProgress : function() {
            if (!this.data.me.profile.userprogress){
                this.data.me.profile.userprogress = {};
            }
            var me = this.data.me,
                progressData = "",
                tooltipProfileFlag = "",
                tooltipSelector = "",
                tooltipTitle = "",
                tooltipDescription = "",
                tooltipArrow = "top",
                tooltipTop = 0,
                tooltipLeft = 0,
                displayTooltip = false,
                contentLink = "",
                hashPos = "",
                newContentLink = "";
            var curDate = new Date();
            var curTimestamp = curDate.getTime();
            var intervalTimestamp = parseInt(sakai_conf.SystemTour.reminderIntervalHours, 10) * 60 * 60 * 1000;

            if (sakai_conf.SystemTour.enableReminders && me.profile.userprogress.hideSystemTour && !me.profile.userprogress.hideSystemTourReminders) {
                if (!me.profile.userprogress.uploadedProfilePhoto && 
                    (!me.profile.userprogress.uploadedProfilePhotoReminder || 
                        (!me.profile.userprogress.uploadedProfilePhoto && me.profile.userprogress.uploadedProfilePhotoReminder && 
                            ((me.profile.userprogress.uploadedProfilePhotoReminder + intervalTimestamp) < curTimestamp)))) {
                    progressData = {"uploadedProfilePhotoReminder": curTimestamp};
                    tooltipSelector = "#changepic_container_trigger";
                    tooltipTitle = "TOOLTIP_ADD_MY_PHOTO";
                    tooltipDescription = "TOOLTIP_ADD_MY_PHOTO_P1";
                    displayTooltip = true;
                    $(".systemtour_1").addClass("systemtour_1_selected");
                    $(".systemtour_1").addClass("systemtour_button_selected");
                } else if (!me.profile.userprogress.uploadedContent && 
                    (!me.profile.userprogress.uploadedContentReminder || 
                        (!me.profile.userprogress.uploadedContent && me.profile.userprogress.uploadedContentReminder && 
                            ((me.profile.userprogress.uploadedContentReminder + intervalTimestamp) < curTimestamp)))) {
                    progressData = {"uploadedContentReminder": curTimestamp};
                    tooltipSelector = "#mycontent_footer_upload_link";
                    tooltipTitle = "TOOLTIP_UPLOAD_CONTENT";
                    tooltipDescription = "TOOLTIP_UPLOAD_CONTENT_P1";
                    displayTooltip = true;
                    $(".systemtour_3").addClass("systemtour_3_selected");
                    $(".systemtour_3").addClass("systemtour_button_selected");
                } else if (!me.profile.userprogress.sharedContent && 
                    (!me.profile.userprogress.sharedContentReminder && me.profile.userprogress.uploadedContent || 
                        (!me.profile.userprogress.sharedContent && me.profile.userprogress.sharedContentReminder && me.profile.userprogress.uploadedContent && 
                            ((me.profile.userprogress.sharedContentReminder + intervalTimestamp) < curTimestamp)))) {
                    progressData = {"sharedContentReminder": curTimestamp};
                    tooltipSelector = "#mycontent_footer_upload_link";
                    tooltipTitle = "TOOLTIP_SHARE_CONTENT";
                    tooltipDescription = "TOOLTIP_SHARE_CONTENT_P2";
                    tooltipArrow = "bottom";
                    tooltipTop = 70;
                    tooltipLeft = -100;
                    displayTooltip = true;
                    $(".systemtour_4").addClass("systemtour_1_selected");
                    $(".systemtour_4").addClass("systemtour_button_selected");
                    $(".mycontent_item_link").each(function(index) {
                        if ($(this).attr("href") && $(this).attr("href").indexOf("sharecontenttour") === -1) {
                            contentLink = $(this).attr("href");
                            hashPos = contentLink.indexOf("#");
                            newContentLink = contentLink.substr(0, hashPos) + "?sharecontenttour=true" + contentLink.substr(hashPos);
                            $(this).attr("href", newContentLink);
                        }
                    });
                } else if (!me.profile.userprogress.madeContactRequest && 
                    (!me.profile.userprogress.madeContactRequestReminder || 
                        (!me.profile.userprogress.madeContactRequest && me.profile.userprogress.madeContactRequestReminder && 
                            ((me.profile.userprogress.madeContactRequestReminder + intervalTimestamp) < curTimestamp)))) {
                    progressData = {"madeContactRequestReminder": curTimestamp};
                    tooltipSelector = "#mycontacts_footer_search";
                    tooltipTitle = "TOOLTIP_ADD_CONTACTS";
                    tooltipDescription = "TOOLTIP_ADD_CONTACTS_P1";
                    tooltipArrow = "bottom";
                    displayTooltip = true;
                    $(".systemtour_5").addClass("systemtour_5_selected");
                    $(".systemtour_5").addClass("systemtour_button_selected");
                    if ($("#mycontacts_footer_search").attr("href") && $("#mycontacts_footer_search").attr("href").indexOf("addcontactstour") === -1) {
                        contentLink = $("#mycontacts_footer_search").attr("href");
                        hashPos = contentLink.indexOf("#");
                        newContentLink = contentLink.substr(0, hashPos) + "?addcontactstour=true" + contentLink.substr(hashPos);
                        $("#mycontacts_footer_search").attr("href", newContentLink);
                    }
                    if ($("#navigation_people_link").attr("href") && $("#navigation_people_link").attr("href").indexOf("addcontactstour") === -1) {
                        contentLink = $("#navigation_people_link").attr("href");
                        hashPos = contentLink.indexOf("#");
                        newContentLink = contentLink.substr(0, hashPos) + "?addcontactstour=true" + contentLink.substr(hashPos);
                        $("#navigation_people_link").attr("href", newContentLink);
                    }
                } else if (!me.profile.userprogress.halfCompletedProfile && 
                    (!me.profile.userprogress.halfCompletedProfileReminder || 
                        (!me.profile.userprogress.halfCompletedProfile && me.profile.userprogress.halfCompletedProfileReminder && 
                            ((me.profile.userprogress.halfCompletedProfileReminder + intervalTimestamp) < curTimestamp)))) {
                    progressData = {"halfCompletedProfileReminder": curTimestamp};
                    tooltipSelector = "#entity_edit_profile";
                    tooltipTitle = "TOOLTIP_EDIT_MY_PROFILE";
                    tooltipDescription = "TOOLTIP_EDIT_MY_PROFILE_P1";
                    displayTooltip = true;
                    addUserProgress("halfCompletedProfileInProgress");
                    $(".systemtour_2").addClass("systemtour_2_selected");
                    $(".systemtour_2").addClass("systemtour_button_selected");
                    if ($("#entity_edit_profile").attr("href") && $("#entity_edit_profile").attr("href").indexOf("editprofiletour") === -1) {
                        $("#entity_edit_profile").attr("href", $("#entity_edit_profile").attr("href") + "?editprofiletour=true");
                    }
                }
            }

            if (displayTooltip){
                var tooltipData = {
                    "tooltipSelector": tooltipSelector,
                    "tooltipTitle": tooltipTitle,
                    "tooltipDescription": tooltipDescription,
                    "tooltipArrow": tooltipArrow,
                    "tooltipTop": tooltipTop,
                    "tooltipLeft" : tooltipLeft,
                    "tooltipAutoClose": false
                };

                var authprofileURL = "/~" + me.user.userid + "/public/authprofile/userprogress";
                sakai_serv.saveJSON(authprofileURL, progressData, function(success, data){
                    // Check whether save was successful
                    if (success) {
                        // Display the tooltip
                        if (!sakai.tooltip || !sakai.tooltip.isReady) {
                            $(window).bind("sakai-tooltip-ready", function() {
                                $(window).trigger("sakai-tooltip-init", tooltipData);
                            });
                        } else {
                            $(window).trigger("sakai-tooltip-init", tooltipData);
                        }
                    }
                });
            }
        }
    };
});
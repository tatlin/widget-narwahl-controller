/* global cprequire_test macro chilipeppr THREE $ requirejs cprequire cpdefine chilipeppr */
// Test this element. This code is auto-removed by the chilipeppr.load()
cprequire_test(["inline:com-chilipeppr-widget-robot-axes"], function (xyz) {
    console.log("test running of " + xyz.id);
    //sp.init("192.168.1.7");
    //xyz.initAs3dPrinting();
    xyz.init();
    xyz.showBody("com-chilipeppr-widget-robot-axes");
    
    $('body').css("padding", "20px");

} /*end_test*/ );

cpdefine("inline:com-chilipeppr-widget-robot-axes", ["chilipeppr_ready", "jquerycookie"], function () {
    return {
        id: "com-chilipeppr-widget-robot-axes",
        url: "(auto fill by runme.js)",       // The final URL of the working widget as a single HTML file with CSS and Javascript inlined. You can let runme.js auto fill this if you are using Cloud9.
        fiddleurl: "(auto fill by runme.js)", // The edit URL. This can be auto-filled by runme.js in Cloud9 if you'd like, or just define it on your own to help people know where they can edit/fork your widget
        githuburl: "(auto fill by runme.js)", // The backing github repo
        testurl: "(auto fill by runme.js)",   // The standalone working widget so can view it working by itself
        name: "Widget / Robot Arm Axes",
        desc: "This widget lets you see the axes information for the 6 actuators on a robot arm plus grippers or other end units. It enables you to jog, home, and change units.",
        publish: {},
        subscribe: {},
        foreignPublish: {
            // '/com-chilipeppr-widget-serialport/send': "We publish to the serial port Gcode jog commands"
            '/com-chilipeppr-widget-cayenn/sendToDeviceNameViaTcp': "We publish to the Cayenn widget so it can send jog values to the Cayenn device by name like Wrist1, Wrist2, Wrist3, etc.",
        },
        foreignSubscribe: {
            '/com-chilipeppr-widget-cayenn/onRecvFromDeviceName': "We subscribe to the Cayenn widget so when it tells us the step value of axes like Wrist1, Wrist2, Wrist3, etc we can update our widget.",
            // "/com-chilipeppr-interface-cnccontroller/axes": "We want X,Y,Z,A,MX,MY,MZ,MA axis updates.",
            // "/com-chilipeppr-interface-cnccontroller/coords": "Track which is active: G54, G55, etc.",
            // "/com-chilipeppr-interface-cnccontroller/plannerpause": "We need to know when to pause sending jog cmds.",
            // "/com-chilipeppr-interface-cnccontroller/plannerresume": "We need to know when to resume jog cmds.",
            // "/com-chilipeppr-interface-cnccontroller/units": "Deprecated. Not listening to this anymore. See next.",
            // '/com-chilipeppr-widget-3dviewer/unitsChanged': "Listenting to see if the 3D Viewer is telling us that the user Gcode is in a specific coordinate and then just assuming we will only be sent axes coordinate updates in that unit. Not using /com-chilipeppr-interface-cnccontroller/units anymore."
        },
        init: function () {

            // Do UI setup
            this.initBody();
            // this.menuSetup();
            this.jogSetup();
            
            // this.pencilSetup();

            this.forkSetup();
            this.toolbarSetup();

            // setup subscribe so we get axes info for Cayenn device
            this.setupOnRecvFromDeviceName();

            // setup DOM elements for the Axes in the UI
            this.setupAxes();

            // setup cookie based UI settings
            this.setupUiFromCookie();

            this.createDomAxes();

            console.log(this.name + " done loading.");
        },
        /**
         * Method for sending to Cayenn device
         */
        send: function(name, obj) {
            chilipeppr.publish("/com-chilipeppr-widget-cayenn/sendToDeviceNameViaTcp", name, obj ) 
        },
        /**
         * Setup to get incoming data from Cayenn devices by their name.
         */
        setupOnRecvFromDeviceName: function() {
            chilipeppr.subscribe('/com-chilipeppr-widget-cayenn/onRecvFromDeviceName', this, this.onRecvFromDeviceName);
        },
        /**
         * Called when we get incoming data from Cayenn devices by their name.
         */
        onRecvFromDeviceName: function(payload) {
            console.log("got onRecvFromDeviceName. payload:", payload);

            // data looks like
            /*
            Addr: {IP: "10.0.0.175", Port: 60623, Network: "tcp", TcpOrUdp: "tcp"}
            Announce: ""
            DeviceId: "chip:0xa330aea4d6e7-ip:10.0.0.175"
            JsonTag: "{"TransId":1,"Stat":{"Step":0,"Temp":-45.6,"Freq":10,"Motor":{"CSACTUAL":0,"fsactive":0,"olb":1,"stallGuard":0,"ola":1,"ot":0,"stst":1,"s2gb":0,"s2ga":0,"otpw":0,"SG_RESULT":0},"FanSpeed":0},"Resp":"StatusGet"}"
            Name: "Wrist3"
            Tag: {TransId: 1, Stat: {…}, Resp: "StatusGet"}
            Widget: ""
            */
            
            if (payload && payload.Name && payload.Name.length > 0) {

                if (payload.Tag && "Stat" in payload.Tag) {

                    var el = $("#com-chilipeppr-widget-robot-axes-" + name);

                    if ("Step" in payload.Tag.Stat ) {
                        // update axes val
                        // this.setAxesStepVal(payload.Name, payload.Tag.Stat.Step);
                    
                        // do neg/positive
                        if (val < 0) {
                            el.find(".xyz-negpos").removeClass("xyz-dimmed");
                            val = Math.abs(val);
                        } else {
                            el.find(".xyz-negpos").addClass("xyz-dimmed");
                        }

                        var str = val + "";

                        // figure out how many digits to show grayed out
                        var grayDigits = 5 - str.length;
                        if (grayDigits < 0) grayDigits = 0;
                        el.find(".xyz-intgray").text("0".repeat(grayDigits));

                        // update main number
                        el.find(".xyz-intblack").text(str);
                    }
                    if ("StepPcnt" in payload.Tag.Stat) {
                        el.find(".xyz-pulsecnt").text(payload.Tag.Stat.StepRmt);
                    }
                    if ("Fan" in payload.Tag.Stat) {
                        el.find(".xyz-fan-pct").text(payload.Tag.Stat.Fan);
                    }
                    if ("Temp" in payload.Tag.Stat) {
                        el.find(".xyz-temp-c").text(payload.Tag.Stat.Temp);
                    }
                }
            }
        },
        /**
         * Set the axes value by name
         */
        setAxesStepVal: function(name, val) {
            console.log("got setAxesStepVal. val:", val, "name:", name);
            var el = $("#com-chilipeppr-widget-robot-axes-" + name);
            
            // do neg/positive
            if (val < 0) {
                el.find(".xyz-negpos").removeClass("xyz-dimmed");
                val = Math.abs(val);
            } else {
                el.find(".xyz-negpos").addClass("xyz-dimmed");
            }

            var str = val + "";

            // figure out how many digits to show grayed out
            var grayDigits = 5 - str.length;
            if (grayDigits < 0) grayDigits = 0;
            el.find(".xyz-intgray").text("0".repeat(grayDigits));

            // update main number
            el.find(".xyz-intblack").text(str);
        },
        // This takes the template in the HTML and reproduces per axis to make this easier
        // since we have 6 and more for grippers
        createDomAxes: function() {
            var elTmplt = $('#com-chilipeppr-widget-robot-axes-tmplt');
            var arr = ['Base', 'Upperarm', 'Forearm', 'Wrist1', 'Wrist2', 'Wrist3'];
            var arrName = ['Base', 'Upper Arm', 'Forearm', 'Wrist 1', 'Wrist 2', 'Wrist 3'];
            var that = this;
            var prefix = "";
            prefix = "https://raw.githubusercontent.com/chilipeppr/widget-robot-axes/master/";

            for (let index = 0; index < arr.length; index++) {
                const element = arr[index];
                
                var clone = elTmplt.clone();
                clone.attr("id", "com-chilipeppr-widget-robot-axes-" + element);
                clone.find('.widget-robot-axes-img').css('background-image', "url('" + prefix + element + ".jpg')");
                clone.find('.axis-name').text(arrName[index]);
                elTmplt.parent().append(clone);

                // attach events
                var btnJogFwd = clone.find(".jog-fwd");
                btnJogFwd.on("click", this.onJogFwdClick.bind(this));
                btnJogFwd.data("id", element);
                var btnJogRev = clone.find(".jog-rev");
                btnJogRev.on("click", this.onJogRevClick.bind(this));
                btnJogRev.data("id", element);
            }
            
            elTmplt.addClass("hidden");
        },
        onJogFwdClick: function(evt) {
            console.log("Got onJogFwdClick. evt:", evt);
            var el = $(evt.currentTarget);
            var id = el.data("id");
            console.log("id:", id);

            // see if pressed already or not
            if (el.hasClass("active")) {
                // button is already pressed, unpress it
                el.removeClass("active");
                // stop the jog

            } else {
                // button is not pressed
                el.addClass("active");
                // start the jog
            }
        },
        onJogRevClick: function(evt) {
            console.log("Got onJogRevClick. evt:", evt);
            var el = $(evt.currentTarget);
            var id = el.data("id");
            console.log("id:", id);

            // see if pressed already or not
            if (el.hasClass("active")) {
                // button is already pressed, unpress it
                el.removeClass("active");
                // stop the jog

            } else {
                // button is not pressed
                el.addClass("active");
                // start the jog
            }
        },
        titleCase: function(str) {
            var s = str.charAt(0).toUpperCase();
            s += str.slice(1);
            return s;
        },
        pencilSetup: function() {
            // add mouseover events to DRO numbers
            //$('#com-chilipeppr-widget-robot-axes-x').mouseover(this.pencilOnMouseover.bind(this));
            //$('#com-chilipeppr-widget-robot-axes-x').mouseout(this.pencilOnMouseout.bind(this));
            $('#com-chilipeppr-widget-robot-axes-x').hover(this.pencilOnMouseover.bind(this), this.pencilOnMouseout.bind(this));
            $('#com-chilipeppr-widget-robot-axes-y').hover(this.pencilOnMouseover.bind(this), this.pencilOnMouseout.bind(this));
            $('#com-chilipeppr-widget-robot-axes-z').hover(this.pencilOnMouseover.bind(this), this.pencilOnMouseout.bind(this));
            $('#com-chilipeppr-widget-robot-axes-a').hover(this.pencilOnMouseover.bind(this), this.pencilOnMouseout.bind(this));
        },
        pencilOnMouseover: function(evt) {
            console.log("got pencilOnMouseover. evt:", evt);
            var tgtEl = $(evt.currentTarget);
            var btn = $('<button class="btn btn-xs btn-default xyz-pencil"><span class="glyphicon glyphicon-pencil"></span></button>');
            btn.click(this.pencilClick.bind(this));
            tgtEl.find('.widget-robot-axes-pos-well').prepend(btn);
            
            // attach descriptive popoover
            btn.popover({
                animation: true,
                delay: 500,
                placement: "auto",
                container: "body",
                trigger: "hover",
                title: "Enter a new coordinate",
                content: "Move to a new coordinate in this axis by modifying the value and hitting the enter key."
            });
        },
        pencilOnMouseout: function(evt) {
            console.log("got pencilOnMouseout. evt:", evt);
            var tgtEl = $(evt.currentTarget);
            this.pencilHide(tgtEl);
        },
        pencilClick: function(evt) {
            console.log("got pencilClick. evt:", evt);
            var tgtEl = $(evt.currentTarget);
            
            var txt = $('<input type="number" class="form-control xyz-number" placeholder="Enter New Coord">');
            txt.keyup(this.pencilKeypress.bind(this));
            var posEl = tgtEl.parents('.widget-robot-axes-pos-well');
            console.log("lastCoords:", this.lastCoords, "lastVal:", this.lastVal);
            var val = this.lastVal[posEl.data('axis')];
            txt.val(val);
            posEl.prepend(txt);
            txt.focus();
            
            // hide popover
            posEl.find('button').popover('hide');
        },
        pencilCtr: 0,
        pencilKeypress: function(evt) {
            console.log("got pencilKeypress. evt:", evt);
            var tgtEl = $(evt.currentTarget);
            var posEl = tgtEl.parents('.widget-robot-axes-pos-well');
            var axis = posEl.data('axis').toUpperCase();
            console.log("axis:", axis);
            
            // see if return key
            if (evt.keyCode == 13) {
                console.log("enter key hit");
                
                // send gcode
                var gcode = "G90 G0 " + axis + tgtEl.val();
                console.log("about to send gcode:", gcode);
                chilipeppr.publish('/com-chilipeppr-widget-serialport/jsonSend', {
                    D: gcode, 
                    Id:"axes" + this.pencilCtr++
                });
                
                this.pencilHide(tgtEl.parents('.widget-robot-axes-pos-well'));
            } else if (evt.keyCode == 27) {
                console.log("ESC key hit");
                this.pencilHide(tgtEl.parents('.widget-robot-axes-pos-well'));
            }
            
            
        },
        pencilHide: function(tgtEl) {
        		console.log("pencilHide");
        		// hide popover
          tgtEl.find('button').popover('hide');
            //tgtEl.popover('hide');
            tgtEl.find('.xyz-pencil').remove();
            tgtEl.find('.xyz-number').remove();
        },
        
        toolbarSetup: function () {
            // config the css sizes to get more compact display
            var config = localStorage.getItem("/" + this.id + "/size");
            if (config == "small") this.bodyShowSmall();

            var that = this;
            $('#com-chilipeppr-widget-robot-axes .view-small').click(function () {
                that.bodyShowSmall();
                localStorage.setItem("/" + that.id + "/size", "small");
            });
            $('#com-chilipeppr-widget-robot-axes .view-large').click(function () {
                that.bodyShowNormal();
                localStorage.setItem("/" + that.id + "/size", "normal");
            });
        },
        bodyShowSmall: function () {
            $('#com-chilipeppr-widget-robot-axes').addClass("size-small");
            $('#com-chilipeppr-widget-robot-axes .view-small').addClass("active");
            $('#com-chilipeppr-widget-robot-axes .view-large').removeClass("active");
        },
        bodyShowNormal: function () {
            $('#com-chilipeppr-widget-robot-axes').removeClass("size-small");
            $('#com-chilipeppr-widget-robot-axes .view-small').removeClass("active");
            $('#com-chilipeppr-widget-robot-axes .view-large').addClass("active");
        },
        options: null,
        setupUiFromCookie: function () {
            // read vals from cookies
            var options = $.cookie('com-chilipeppr-widget-robot-axes-options');

            if (true && options) {
                options = $.parseJSON(options);
                console.log("just evaled options: ", options);
            } else {
                options = {
                    showA: false,
                    moveBy: 0.01
                };
            }
            this.options = options;
            console.log("options:", options);

            // hilite the correct button
            var cls = ".jogincr1";
            if (options.moveBy == "0.1") cls = ".jogincrpt1";
            if (options.moveBy == "0.01") cls = ".jogincrpt01";
            if (options.moveBy == "0.001") cls = ".jogincrpt001";
            this.changeBaseVal({
                data: {
                    newval: options.moveBy,
                    cls: cls
                }
            });

        },
        saveOptionsCookie: function () {
            var options = {
                showA: false,
                moveBy: this.baseval
            };
            var optionsStr = JSON.stringify(options);
            console.log("saving options:", options, "json.stringify:", optionsStr);
            // store cookie
            $.cookie('com-chilipeppr-widget-robot-axes-options', optionsStr, {
                expires: 365 * 10,
                path: '/'
            });
        },
        
        toggleInMm: function () {
            var gCode;

            if (this.currentUnits == "mm") {
                gCode = "G20";
            } else {
                gCode = "G21";
            }
            console.log("toggleInMm. command:", gCode);
            chilipeppr.publish("/com-chilipeppr-widget-serialport/send", gCode + '\n');
        },
        currentUnits: null,
        updateUnitsFromStatus: function (units) {
            console.log("updateUnitsFromStatus. units:", units);
            $('.widget-robot-axes-dim').text(units);
            this.currentUnits = units;
        },
        lastCoords: {
            coord: null,
            coordNum: null
        },
        onCoordsUpdate: function (coords) {
            console.log("onCoordsUpdate. coords:", coords);
            if (coords.coordNum != this.lastCoords.coordNum) {
                $('.com-chilipeppr-widget-robot-axes-coords').text(coords.coord);
                this.lastCoords = coords;
            }
        },

        axisx: null,
        axisy: null,
        axisz: null,
        axisa: null,
        axes: {},
        //Machine coord version of axes. 
        axismx: null,
        axismy: null,
        axismz: null,
        axisma: null,
        setupAxes: function () {
            this.axisx = {
                intblack: $('#com-chilipeppr-widget-robot-axes-x .xyz-intblack'),
                intgray: $('#com-chilipeppr-widget-robot-axes-x .xyz-intgray'),
                negpos: $('#com-chilipeppr-widget-robot-axes-x .xyz-negpos'),
                decimal: $('#com-chilipeppr-widget-robot-axes-x .xyz-decimal')
            };
            this.axisy = {
                intblack: $('#com-chilipeppr-widget-robot-axes-y .xyz-intblack'),
                intgray: $('#com-chilipeppr-widget-robot-axes-y .xyz-intgray'),
                negpos: $('#com-chilipeppr-widget-robot-axes-y .xyz-negpos'),
                decimal: $('#com-chilipeppr-widget-robot-axes-y .xyz-decimal')
            };
            this.axisz = {
                intblack: $('#com-chilipeppr-widget-robot-axes-z .xyz-intblack'),
                intgray: $('#com-chilipeppr-widget-robot-axes-z .xyz-intgray'),
                negpos: $('#com-chilipeppr-widget-robot-axes-z .xyz-negpos'),
                decimal: $('#com-chilipeppr-widget-robot-axes-z .xyz-decimal')
            };
            this.axisa = {
                intblack: $('#com-chilipeppr-widget-robot-axes-a .xyz-intblack'),
                intgray: $('#com-chilipeppr-widget-robot-axes-a .xyz-intgray'),
                negpos: $('#com-chilipeppr-widget-robot-axes-a .xyz-negpos'),
                decimal: $('#com-chilipeppr-widget-robot-axes-a .xyz-decimal')
            };
            this.axismx = {
                intblack: $('#com-chilipeppr-widget-robot-axes-mx .xyz-intblack'),
                intgray: $('#com-chilipeppr-widget-robot-axes-mx .xyz-intgray'),
                negpos: $('#com-chilipeppr-widget-robot-axes-mx .xyz-negpos'),
                decimal: $('#com-chilipeppr-widget-robot-axes-mx .xyz-decimal')
            };
            this.axismy = {
                intblack: $('#com-chilipeppr-widget-robot-axes-my .xyz-intblack'),
                intgray: $('#com-chilipeppr-widget-robot-axes-my .xyz-intgray'),
                negpos: $('#com-chilipeppr-widget-robot-axes-my .xyz-negpos'),
                decimal: $('#com-chilipeppr-widget-robot-axes-my .xyz-decimal')
            };
            this.axismz = {
                intblack: $('#com-chilipeppr-widget-robot-axes-mz .xyz-intblack'),
                intgray: $('#com-chilipeppr-widget-robot-axes-mz .xyz-intgray'),
                negpos: $('#com-chilipeppr-widget-robot-axes-mz .xyz-negpos'),
                decimal: $('#com-chilipeppr-widget-robot-axes-mz .xyz-decimal')
            };
            this.axisma = {
                intblack: $('#com-chilipeppr-widget-robot-axes-ma .xyz-intblack'),
                intgray: $('#com-chilipeppr-widget-robot-axes-ma .xyz-intgray'),
                negpos: $('#com-chilipeppr-widget-robot-axes-ma .xyz-negpos'),
                decimal: $('#com-chilipeppr-widget-robot-axes-ma .xyz-decimal')
            };
            this.axes = {
                x: this.axisx,
                y: this.axisy,
                z: this.axisz,
                a: this.axisa,
                mx: this.axismx,
                my: this.axismy,
                mz: this.axismz,
                ma: this.axisma
            };
        },
        updateAxesFromStatus: function (axes) {
            console.log("updateAxesFromStatus:", axes);
            if ('x' in axes && axes.x !== null) {
                this.updateAxis("x", axes.x);
            }
            if ('y' in axes && axes.y !== null) {
                this.updateAxis("y", axes.y);
            }
            if ('z' in axes && axes.z !== null) {
                this.updateAxis("z", axes.z);
            }
            if ('a' in axes && axes.a !== null) {
                this.updateAxis("a", axes.a);
            }
            if ('mpo' in axes) {
                axes = axes.mpo;
                var scale = 0;
                if (this.currentUnits == 'mm') scale = 1;
                if (this.currentUnits == 'inch') scale = 1 / 25.4;
                if ('x' in axes && axes.x !== null) {
                    this.updateAxis("mx", this.round(axes.x * scale, 4));
                }
                if ('y' in axes && axes.y !== null) {
                    this.updateAxis("my", this.round(axes.y * scale, 4));
                }
                if ('z' in axes && axes.z !== null) {
                    this.updateAxis("mz", this.round(axes.z * scale, 4));
                }
                if ('a' in axes && axes.a !== null) {
                    this.updateAxis("ma", this.round(axes.a * scale, 4));
                }
            }
        },

        // keep track of lastval so less dom updates to perform
        lastVal: {
            x: 0,
            y: 0,
            z: 0,
            a: 0,
            mx: 0,
            my: 0,
            mz: 0,
            ma: 0
        },
        updateAxis: function (axis, val) {
            console.log("updateAxis. axis:", axis, "val:", val);
            var ax = this.axes[axis];
            var axl = this.lastVal[axis];

            // if this val is same as last val, return immediately
            // this happens alot as the cnc controller could send lots of redundant position updates
            if (val == axl) {
                //console.log("new val:", val, "is same as last val:", axl, "axis:", axis, "exiting");
                return;
            }
            if (ax.intblack !== null) { //Temporary, until we actually have html for machine axis
                // set the negative indicator, but only do it if there was a change
                // to reduce dom updates for efficiency
                if (val < 0 && axl >= 0) {
                    ax.negpos.removeClass("xyz-dimmed");
                    ax.negpos.addClass("xyz-active");
                } else if (val >= 0 && axl < 0) {
                    ax.negpos.removeClass("xyz-active");
                    ax.negpos.addClass("xyz-dimmed");
                }

                // convert float into integer part and decimal part
                var arr = (Math.abs(val) + "").split(".");
                var intval = arr[0];
                //console.log("arr.length:", arr.length, arr);
                //var decval;
                //if (arr.length > 0) decval = arr[1];
                //else decval = "000";
                var decval = ((arr.length > 1) ? arr[1] : "000");
                decval += decval.length == 1 ? "00" : decval.length == 2 ? "0" : "";
                //console.log("abs intval:", intval, "decval:", decval);

                // set the integer part into dom
                ax.intblack.html(intval);

                // see about what dimmed out 0 padding we need
                // use lastval to see if any delta so we have less dom updates to perform since they're slow
                var axla = Math.abs(axl);
                //console.log("abs last val:", axla);
                if (intval >= 100 && axla < 100) ax.intgray.html("");
                else if (intval < 100 && intval >= 10 && (axla < 10 || axla >= 100)) ax.intgray.html("0");
                else if (intval === 0 && axla > 0) ax.intgray.html("00");

                ax.decimal.html(decval);
            }
            // set lastVal so we have it next time into this method
            this.lastVal[axis] = val;
        },
        menuSetup: function () {
            $('#com-chilipeppr-widget-robot-axes .xyz-showa').click(this.showHideAxisA.bind(this));
            $('#com-chilipeppr-widget-robot-axes .showhideaaxis').click(this.showHideAxisA.bind(this));
            $('#com-chilipeppr-widget-robot-axes .showhidemDRO').click(this.showHidemDRO.bind(this));

            // Setup zeroing G92 - per axis menu
            $('#com-chilipeppr-widget-robot-axes-x .dropdown-menu a').eq(0).click("x", this.zeroOutAxisG92.bind(this)).prop('href', 'javascript:');
            $('#com-chilipeppr-widget-robot-axes-y .dropdown-menu a').eq(0).click("y", this.zeroOutAxisG92.bind(this)).prop('href', 'javascript:');;
            $('#com-chilipeppr-widget-robot-axes-z .dropdown-menu a').eq(0).click("z", this.zeroOutAxisG92.bind(this)).prop('href', 'javascript:');;
            $('#com-chilipeppr-widget-robot-axes-a .dropdown-menu a').eq(0).click("a", this.zeroOutAxisG92.bind(this)).prop('href', 'javascript:');;

            // Setup unzeroing G92 - per axis menu
            $('#com-chilipeppr-widget-robot-axes-x .dropdown-menu a').eq(1).click("x", this.unzeroOutAxisG92.bind(this)).prop('href', 'javascript:');
            $('#com-chilipeppr-widget-robot-axes-y .dropdown-menu a').eq(1).click("y", this.unzeroOutAxisG92.bind(this)).prop('href', 'javascript:');;
            $('#com-chilipeppr-widget-robot-axes-z .dropdown-menu a').eq(1).click("z", this.unzeroOutAxisG92.bind(this)).prop('href', 'javascript:');;
            $('#com-chilipeppr-widget-robot-axes-a .dropdown-menu a').eq(1).click("a", this.unzeroOutAxisG92.bind(this)).prop('href', 'javascript:');;

            // Setup goto Work zero - per axis menu
            $('#com-chilipeppr-widget-robot-axes-x .dropdown-menu a').eq(2).click("x", this.gotoZero.bind(this)).prop('href', 'javascript:');
            $('#com-chilipeppr-widget-robot-axes-y .dropdown-menu a').eq(2).click("y", this.gotoZero.bind(this)).prop('href', 'javascript:');
            $('#com-chilipeppr-widget-robot-axes-z .dropdown-menu a').eq(2).click("z", this.gotoZero.bind(this)).prop('href', 'javascript:');
            $('#com-chilipeppr-widget-robot-axes-a .dropdown-menu a').eq(2).click("a", this.gotoZero.bind(this)).prop('href', 'javascript:');

            // Setup zeroing G10 (work) - per axis menu
            $('#com-chilipeppr-widget-robot-axes-x .dropdown-menu a').eq(3).click("mx", this.zeroOutAxisG10.bind(this)).prop('href', 'javascript:');
            $('#com-chilipeppr-widget-robot-axes-y .dropdown-menu a').eq(3).click("my", this.zeroOutAxisG10.bind(this)).prop('href', 'javascript:');;
            $('#com-chilipeppr-widget-robot-axes-z .dropdown-menu a').eq(3).click("mz", this.zeroOutAxisG10.bind(this)).prop('href', 'javascript:');;
            $('#com-chilipeppr-widget-robot-axes-a .dropdown-menu a').eq(3).click("ma", this.zeroOutAxisG10.bind(this)).prop('href', 'javascript:');;

            // Setup goto Machine zero - per axis menu
            $('#com-chilipeppr-widget-robot-axes-x .dropdown-menu a').eq(4).click("x", this.gotoZeroM.bind(this)).prop('href', 'javascript:');
            $('#com-chilipeppr-widget-robot-axes-y .dropdown-menu a').eq(4).click("y", this.gotoZeroM.bind(this)).prop('href', 'javascript:');
            $('#com-chilipeppr-widget-robot-axes-z .dropdown-menu a').eq(4).click("z", this.gotoZeroM.bind(this)).prop('href', 'javascript:');
            $('#com-chilipeppr-widget-robot-axes-a .dropdown-menu a').eq(4).click("a", this.gotoZeroM.bind(this)).prop('href', 'javascript:');

            // Setup homing with no limit switches - per axis menu
            $('#com-chilipeppr-widget-robot-axes-x .dropdown-menu a').eq(5).click("x", this.zeroOutAxisG28.bind(this)).prop('href', 'javascript:');
            $('#com-chilipeppr-widget-robot-axes-y .dropdown-menu a').eq(5).click("y", this.zeroOutAxisG28.bind(this)).prop('href', 'javascript:');;
            $('#com-chilipeppr-widget-robot-axes-z .dropdown-menu a').eq(5).click("z", this.zeroOutAxisG28.bind(this)).prop('href', 'javascript:');;
            $('#com-chilipeppr-widget-robot-axes-a .dropdown-menu a').eq(5).click("a", this.zeroOutAxisG28.bind(this)).prop('href', 'javascript:');;

            // Setup homing with limit switches - per axis menu
            $('#com-chilipeppr-widget-robot-axes-x .dropdown-menu a').eq(6).click("x", this.homeAxis.bind(this)).prop('href', 'javascript:');
            $('#com-chilipeppr-widget-robot-axes-y .dropdown-menu a').eq(6).click("y", this.homeAxis.bind(this)).prop('href', 'javascript:');;
            $('#com-chilipeppr-widget-robot-axes-z .dropdown-menu a').eq(6).click("z", this.homeAxis.bind(this)).prop('href', 'javascript:');;
            $('#com-chilipeppr-widget-robot-axes-a .dropdown-menu a').eq(6).click("a", this.homeAxis.bind(this)).prop('href', 'javascript:');;

        },
        publishSend: function(gcode) {
            var jsonSend = {
                D: gcode,
                Id: "jog" + this.sendCtr
            };
            chilipeppr.publish("/com-chilipeppr-widget-serialport/jsonSend", jsonSend);
            this.sendCtr++;
            if (this.sendCtr > 999999) this.sendCtr = 0;
        },
        gotoZeroM: function (evt) {
            this.gotoZero(evt, 'M');
        },
        gotoZero: function (evt, m) {
            console.log("gotoZero. evt.data:", evt.data, "evt:", evt, "m:", m);
            var cmd = "";
            if (m !== undefined) {
                cmd += "G53 ";
            }
            cmd += "G0 ";
            if (evt.data == "xyz") {
                cmd += "X0 Y0 Z0";
                // if a axis showing
                if (this.isAAxisShowing) {
                    cmd += " A0";
                }
            } else {
                cmd += evt.data.toUpperCase() + "0";
            }
            cmd += "\n";
            console.log(cmd);
            //chilipeppr.publish("/com-chilipeppr-widget-serialport/send", cmd);
            this.publishSend(cmd);

        },
        zeroOutAxisG10: function (evt) {
            console.warn("zeroOutAxis10. evt.data:", evt.data, "evt:", evt, "lastVal:", this.lastVal.mx);
            var cmd = '';
            if (evt.data == "xyz") {
                cmd += 'G10 L2 P' + (this.lastCoords.coordNum - 53) + ' X' + (this.lastVal.mx) + ' Y' + (this.lastVal.my) + ' Z' + (this.lastVal.mz);
                if (this.isAAxisShowing) {
                    cmd += ' A' + (this.lastVal.ma);
                }
            } else {
                cmd += 'G10 L2 P' + (this.lastCoords.coordNum - 53) + evt.data.substr(-1).toUpperCase() + (this.lastVal[evt.data]);
            }
            cmd += "\n";
            console.log(cmd);
            //chilipeppr.publish("/com-chilipeppr-widget-serialport/send", cmd);
            this.publishSend(cmd);
            
        },
        zeroOutAxisG28: function (evt) {
            console.log("zeroOutAxis28. evt.data:", evt.data, "evt:", evt);
            var cmd = "G28.3 ";
            if (evt.data == "xyz") {
                cmd += "X0 Y0 Z0";
                if (this.isAAxisShowing) {
                    cmd += " A0";
                }
            } else {
                cmd += evt.data.toUpperCase() + "0";
            }
            cmd += "\n";
            console.log(cmd);
            //chilipeppr.publish("/com-chilipeppr-widget-serialport/send", cmd);
            this.publishSend(cmd);
        },
        zeroOutAxisG92: function (evt) {
            console.log("zeroOutAxis92. evt.data:", evt.data, "evt:", evt);
            var cmd = "G92 ";
            if (evt.data == "xyz") {
                cmd += "X0 Y0 Z0";
                if (this.isAAxisShowing) {
                    cmd += " A0";
                }
            } else {
                cmd += evt.data.toUpperCase() + "0";
            }
            cmd += "\n";
            console.log(cmd);
            //chilipeppr.publish("/com-chilipeppr-widget-serialport/send", cmd);
            this.publishSend(cmd);

        },
        unzeroOutAxisG92: function (evt) {
            console.log("zeroOutAxis92. evt.data:", evt.data, "evt:", evt);
            var cmd = "G92.1 ";
            if (evt.data == "xyz") {
                cmd += "X0 Y0 Z0";
                if (this.isAAxisShowing) {
                    cmd += " A0";
                }
            } else {
                cmd += evt.data.toUpperCase() + "0";
            }
            cmd += "\n";
            console.log(cmd);
            //chilipeppr.publish("/com-chilipeppr-widget-serialport/send", cmd);
            this.publishSend(cmd);

        },
        homeAxis: function (evt) {
            // Homes all axes present in command. At least one axis letter must be present. The value (number) must be provided but is ignored.
            // The homing sequence is fixed and always starts with the Z axis (if requested). The sequence runs ZXYA (but skipping all axes that are not specified in the G28.2 command)
            console.log("homeAxis. evt.data:", evt.data, "evt:", evt);
            var cmd = "G28.2 ";
            if (evt.data == "xyz") {
                cmd += "X0 Y0 Z0";
                if (this.isAAxisShowing) {
                    cmd += " A0";
                }
            } else {
                cmd += evt.data.toUpperCase() + "0";
            }
            cmd += "\n";
            console.log(cmd);
            //chilipeppr.publish("/com-chilipeppr-widget-serialport/send", cmd);
            this.publishSend(cmd);

        },
        isAAxisShowing: false,
        showHideAxisA: function () {
            var el = $('#com-chilipeppr-widget-robot-axes-a');
            if (el.hasClass('hidden')) {
                this.isAAxisShowing = true;
                el.removeClass('hidden');
                $('#com-chilipeppr-widget-robot-axes .showhideaaxis').addClass("active");
            } else {
                this.isAAxisShowing = false;
                el.addClass('hidden');
                $('#com-chilipeppr-widget-robot-axes .showhideaaxis').removeClass("active");
            }
            $(window).trigger('resize');
        },
        ismDROShowing: false,
        showHidemDRO: function () {
            var el = $('#com-chilipeppr-widget-robot-axes-mx');
            if ($('#com-chilipeppr-widget-robot-axes-mx').hasClass('hidden')) {
                this.ismDROShowing = true;
                $('#com-chilipeppr-widget-robot-axes-mx').removeClass('hidden');
                $('#com-chilipeppr-widget-robot-axes-my').removeClass('hidden');
                $('#com-chilipeppr-widget-robot-axes-mz').removeClass('hidden');
                $('#com-chilipeppr-widget-robot-axes .showhidemDRO').addClass("active");
            } else {
                this.ismDROShowing = false;
                $('#com-chilipeppr-widget-robot-axes-mx').addClass('hidden');
                $('#com-chilipeppr-widget-robot-axes-my').addClass('hidden');
                $('#com-chilipeppr-widget-robot-axes-mz').addClass('hidden');
                $('#com-chilipeppr-widget-robot-axes .showhidemDRO').removeClass("active");
            }
            $(window).trigger('resize');
        },
        btnSetup: function () {
            // setup planner indicator icon
            $('#com-chilipeppr-widget-robot-axes div.plannerpause').popover({
                html: true,
                delay: 200,
                animation: true,
                trigger: 'hover',
                placement: 'auto',
                container: 'body'
            });

            // in / mm
            $('#com-chilipeppr-widget-robot-axes .btnInMm').click(this.toggleInMm.bind(this));

            $('#com-chilipeppr-widget-robot-axes .showhidemDRO').popover();
            $('#com-chilipeppr-widget-robot-axes .showhideaaxis').popover();
            $('#com-chilipeppr-widget-robot-axes .btnInMm').popover();
            $('#com-chilipeppr-widget-robot-axes .btnmachineDRO').popover();
        },
        jogFocusIndicate: function () {
            $('#com-chilipeppr-widget-robot-axes').addClass("panel-primary");
        },
        jogFocusUnindicate: function () {
            $('#com-chilipeppr-widget-robot-axes').removeClass("panel-primary");
        },
        isInCustomMenu: false,
        customMenuSetVal: function (itemNum) {
            console.log("setting custom val from itemNum:", itemNum);
            if (itemNum instanceof Object) itemNum = itemNum.data; // convert evt obj to just the data
            var cls = ".jogincrCustomInput" + itemNum;
            var inputEl = $('#com-chilipeppr-widget-robot-axes-ftr ' + cls);
            var val = parseFloat(inputEl.val());
            if (val != null) {
                $('#com-chilipeppr-widget-robot-axes-ftr .jogincrCustomVal').text(val);
                this.changeBaseVal({
                    data: {
                        newval: val,
                        cls: ".jogincrCustomBtn"
                    }
                });
            } else $('#com-chilipeppr-widget-robot-axes-ftr .jogincrCustomVal').text("-");
        },
        jogSetup: function () {
            // attach to focus and blur events
            // when focused, we'll jog
            var that = this;
            // $('#com-chilipeppr-widget-robot-axes-jog').popover();
            // $('#com-chilipeppr-widget-robot-axes-ftr .btn').popover();


            // setup button events
            // $('#com-chilipeppr-widget-robot-axes-ftr .jogx').click("X+", this.jogBtn.bind(this));
            // $('#com-chilipeppr-widget-robot-axes-ftr .jogy').click("Y+", this.jogBtn.bind(this));
            // $('#com-chilipeppr-widget-robot-axes-ftr .jogz').click("Z+", this.jogBtn.bind(this));
            // $('#com-chilipeppr-widget-robot-axes-ftr .jogxneg').click("X-", this.jogBtn.bind(this));
            // $('#com-chilipeppr-widget-robot-axes-ftr .jogyneg').click("Y-", this.jogBtn.bind(this));
            // $('#com-chilipeppr-widget-robot-axes-ftr .jogzneg').click("Z-", this.jogBtn.bind(this));

            //gotoZero
            $('#com-chilipeppr-widget-robot-axes-ftr .joggotozerow').click("xyz", this.gotoZero.bind(this));
            $('#com-chilipeppr-widget-robot-axes-ftr .jogzerooutw').click("xyz", this.zeroOutAxisG10.bind(this));
            $('#com-chilipeppr-widget-robot-axes-ftr .joghomem').click("xyz", this.homeAxis.bind(this));
            $('#com-chilipeppr-widget-robot-axes-ftr .joggotozerom').click("xyz", this.gotoZeroM.bind(this));
            $('#com-chilipeppr-widget-robot-axes-ftr .jogzerooutm').click("xyz", this.zeroOutAxisG28.bind(this));


            // setup base value increment buttons
            $('#com-chilipeppr-widget-robot-axes-ftr .jogincr1').click({
                newval: 1.0,
                cls: ".jogincr1"
            }, this.changeBaseVal.bind(this));
            $('#com-chilipeppr-widget-robot-axes-ftr .jogincrpt1').click({
                newval: 0.1,
                cls: ".jogincrpt1"
            }, this.changeBaseVal.bind(this));
            $('#com-chilipeppr-widget-robot-axes-ftr .jogincrpt01').click({
                newval: 0.01,
                cls: ".jogincrpt01"
            }, this.changeBaseVal.bind(this));
            $('#com-chilipeppr-widget-robot-axes-ftr .jogincrpt001').click({
                newval: 0.001,
                cls: ".jogincrpt001"
            }, this.changeBaseVal.bind(this));

            // setup custom increment button
            var custIncrBtn = $('#com-chilipeppr-widget-robot-axes-ftr .jogincrCustomBtn');
            custIncrBtn.click(function () {
                var txt = $('#com-chilipeppr-widget-robot-axes-ftr .jogincrCustomVal').text();
                if (txt != "-") {
                    var val = parseFloat(txt);
                    that.changeBaseVal({
                        data: {
                            newval: val,
                            cls: ".jogincrCustomBtn"
                        }
                    });
                }
            });

            var custDropUpBtn = $('#com-chilipeppr-widget-robot-axes-ftr .jogincrCustomDropUpBtn');
            custDropUpBtn.on('click', function () {
                console.log("drop up btn clicked");
                that.isInCustomMenu = true;
                //$('#com-chilipeppr-widget-robot-axes-ftr').blur();
            });

            // show/ hide.bs.dropdown
            var custMenu = $('#com-chilipeppr-widget-robot-axes-ftr .jogincrCustomDropUpMenu').parent();
            custMenu.on('show.bs.dropdown', function () {
                console.log("drop up custom increment menu shown");
                that.isInCustomMenu = true;
                $('#com-chilipeppr-widget-robot-axes-ftr').blur();
            });
            custMenu.on('hidden.bs.dropdown', function () {
                console.log("drop up custom increment menu hidden");
                that.isInCustomMenu = false;
                $('#com-chilipeppr-widget-robot-axes-ftr').blur();
            });

            var custInput = $('#com-chilipeppr-widget-robot-axes-ftr .jogincrCustomInput');
            custInput.click(function (e) {
                console.log("got click on jogincrCustomInput");
                that.isInCustomMenu = true;
                e.stopPropagation();
                $('#com-chilipeppr-widget-robot-axes-ftr').blur();
                console.log("in custom menu mode");
            });
            custInput.keydown(function (evt) {
                console.log("keypress in custInput. evt:", evt);
                if (evt.keyCode == 13) {
                    console.log("user hit enter");
                    //custMenu.dropdown('toggle');
                    //custMenu.trigger('hide.bs.dropdown');
                    custDropUpBtn.trigger('click');
                    var domEl = $(evt.target);
                    console.log("domEl:", domEl);
                    var cls = domEl.attr('class');
                    cls.match(/jogincrCustomInput(\d)/);
                    var num = RegExp.$1;
                    that.customMenuSetVal(num);
                }
                //evt.preventDefault();
                //evt.stopPropagation();
                //return false;
            });

            // setup custom menu set buttons
            $('#com-chilipeppr-widget-robot-axes-ftr .jogincrCustomSet1').click(1, this.customMenuSetVal.bind(this));
            $('#com-chilipeppr-widget-robot-axes-ftr .jogincrCustomSet2').click(2, this.customMenuSetVal.bind(this));
            $('#com-chilipeppr-widget-robot-axes-ftr .jogincrCustomSet3').click(3, this.customMenuSetVal.bind(this));
            $('#com-chilipeppr-widget-robot-axes-ftr .jogincrCustomSet4').click(4, this.customMenuSetVal.bind(this));

            // setup jog btn
            $('#com-chilipeppr-widget-robot-axes-jog').click(function () {
                console.log("setting focus/blur to footer");
                var elFtr = $('#com-chilipeppr-widget-robot-axes-ftr');
                //if ($('#com-chilipeppr-widget-robot-axes').hasClass('panel-primary'))
                //    elFtr.blur();
                //else
                elFtr.focus();
            });

            var isjogging = false;

            $('#com-chilipeppr-widget-robot-axes-ftr').focusin(function () {
                if (that.isInCustomMenu) {
                    console.log("got focusin for axes widget, but we appear to be showing the custom increment menu, so ignoring focus.");
                    return;
                }
                //console.log("jog area focus");
                $('#com-chilipeppr-widget-robot-axes').addClass("panel-primary");
                $('#com-chilipeppr-widget-robot-axes-ftr').addClass("panel-primary");
                isjogging = true;
                that.accelBaseValHilite({});
                console.log("got focusin on axes widget ftr");
            });
            $('#com-chilipeppr-widget-robot-axes-ftr').focusout(function () {

                //console.log("jog area blur");
                $('#com-chilipeppr-widget-robot-axes').removeClass("panel-primary");
                $('#com-chilipeppr-widget-robot-axes-ftr').removeClass("panel-primary");
                isjogging = false;
                that.accelBaseValHilite({});
                console.log("got focusout on axes widget ftr");
            });
            /*$('#com-chilipeppr-widget-robot-axes-ftr').keypress(function (evt) {
                console.log("got keypress for jog. evt:", evt, evt.which);
            });*/

            // keep track of lastKeydown as a timestamp so we can yeild sending too fast
            that.lastKeydownTime = 0;


            $('#com-chilipeppr-widget-robot-axes-ftr').keydown(function (evt) {

                if (that.isInCustomMenu) {
                    console.log("custom menu showing. not doing jog.");
                    return true;
                }

                // this lets the cnc controller know we started jogging
                // the controller may or may not care
                if (!isjogging && evt.which > 30 && evt.which < 41) {
                    isjogging = true;
                    chilipeppr.publish('/com-chilipeppr-interface-cnccontroller/jogstart', "");
                }

                // hilite the acceleration
                that.accelBaseValHilite(evt);

                // if this keydown event does not contain a relevant keypress then just exit
                if (!(evt.which > 30 && evt.which < 41)) {
                    //console.log("exiting cuz not arrow key. evt:", evt);
                    return;
                } else {
                    console.log("evt:", evt);
                }

                //if (evt.which != 16 && evt.which != 17 && evt.which != 18) console.log("got keydown for jog. evt:", evt, evt.which);
                // let's slow down keypresses so we don't overwhelm the jogging
                var curTime = new Date().getTime();
                if (curTime - that.lastKeydownTime < 40) {
                    console.log("yeilding cuz time was too quick");
                    return;
                }
                that.lastKeydownTime = curTime;

                // see if planner buffer full, if so yeild
                if (that.isPausedByPlanner) {
                    console.log("planner buffer full. yeilding.");
                    return;
                }

                var key = evt.which;
                var direction = null;
                /*
                var isFast, is100xFast, is1000xFast, is10000xFast = false;
                if (evt.shiftKey == true) {
                    isFast = true;
                }
                if (evt.ctrlKey == true) {
                    is100xFast = true;
                }
                if (evt.shiftKey == true && evt.ctrlKey) {
                    is1000xFast = true;
                }
                if (evt.shiftKey == true && evt.altKey == true) {
                    is10000xFast = true;
                }
                */

                if (key == 38) {
                    // up arrow. Y+
                    direction = "Y+";
                    $('#com-chilipeppr-widget-robot-axes-ftr .jogy').addClass("hilite");
                } else if (key == 40) {
                    // down arrow. Y-
                    direction = "Y-";
                    $('#com-chilipeppr-widget-robot-axes-ftr .jogyneg').addClass("hilite");
                } else if (key == 37) {
                    direction = "X-";
                    $('#com-chilipeppr-widget-robot-axes-ftr .jogxneg').addClass("hilite");
                } else if (key == 39) {
                    direction = "X+";
                    $('#com-chilipeppr-widget-robot-axes-ftr .jogx').addClass("hilite");
                } else if (key == 33) {
                    // page up
                    direction = "Z+";
                    $('#com-chilipeppr-widget-robot-axes-ftr .jogz').addClass("hilite");
                } else if (key == 34) {
                    // page down
                    direction = "Z-";
                    $('#com-chilipeppr-widget-robot-axes-ftr .jogzneg').addClass("hilite");
                }

                if (direction) {
                    //that.jog(direction, isFast, is100xFast, is1000xFast, is10000xFast);
                    that.jog(direction);
                }
            });

            // when key is up, we're done jogging
            $('#com-chilipeppr-widget-robot-axes-ftr').keyup(function (evt) {

                if (that.isInCustomMenu) {
                    console.log("custom menu showing. not doing jog.");
                    return true;
                }

                // test if keys that represent real jog (i.e. not shift/ctrl/alt, etc)
                if (evt.which > 30 && evt.which < 41) {
                    // let parent method know jogging is done
                    isjogging = false;

                    // this tells the cnc controller to cancel immediately all moves so jog stops fast
                    chilipeppr.publish('/com-chilipeppr-interface-cnccontroller/jogdone', "");
                }

                //if (!(evt.which > 30 && evt.which < 41)) {
                // remove accel hilite
                that.accelBaseValUnhilite();
                //}                

                var key = evt.which;
                if (key == 38) {
                    // up arrow. Y+
                    $('#com-chilipeppr-widget-robot-axes-ftr .jogy').removeClass("hilite");
                } else if (key == 40) {
                    // down arrow. Y-
                    $('#com-chilipeppr-widget-robot-axes-ftr .jogyneg').removeClass("hilite");
                } else if (key == 37) {
                    $('#com-chilipeppr-widget-robot-axes-ftr .jogxneg').removeClass("hilite");
                } else if (key == 39) {
                    $('#com-chilipeppr-widget-robot-axes-ftr .jogx').removeClass("hilite");
                } else if (key == 33) {
                    // page up
                    $('#com-chilipeppr-widget-robot-axes-ftr .jogz').removeClass("hilite");
                } else if (key == 34) {
                    // page down
                    $('#com-chilipeppr-widget-robot-axes-ftr .jogzneg').removeClass("hilite");
                }

                that.lastKeydownTime = 0;
            });

        },
        jogBtn: function (evt) {
            //console.log("jogBtn:", arguments);
            var direction = evt.data;
            this.accelBaseValHilite(evt);
            /*
            var isFast, is100xFast, is1000xFast, is10000xFast = false;
            //var isSuperFast = false;
            if (evt.shiftKey == true) {
                isFast = true;
            }
            if (evt.ctrlKey == true) {
                is100xFast = true;
            }
            if (evt.altKey == true) {
                is1000xFast = true;
            }
            if (evt.shiftKey == true && evt.altKey == true) {
                is10000xFast = true;
            }
            if (evt.shiftKey == true && evt.ctrlKey) {
                is1000xFast = true;
            }
            */

            //this.jog(direction, isFast, is100xFast, is1000xFast, is10000xFast);
            this.jog(direction);
        },
        baseval: 1.00,
        accelBaseval: 1.00,
        customOrigVal: null,
        accelBaseValHilite: function (evt) {
            //console.log("accelBaseValHilite. this.baseval:", this.baseval);
            //this.accelBaseValUnhilite();
            // see if there's an accelerator key. if so hilite blue to indicate
            // we're accelerating
            var accelval = this.baseval;
            //var baseval = this.baseval;
            var isCustom = false;
            if (accelval != 0.001 && accelval != 0.01 && accelval != 0.1 && accelval != 1) {
                // they have a custom val
                //console.log("doing accelerator on custom val");
                isCustom = true;
            }

            if (evt.shiftKey == true) {
                accelval = this.baseval * 10;
            }
            if (evt.ctrlKey == true || evt.altKey == true) {
                accelval = this.baseval * 100;
            }
            if (evt.shiftKey == true && (evt.ctrlKey == true || evt.altKey == true)) {
                accelval = this.baseval * 1000;
            }

            //console.log("accelval:", accelval);
            this.accelBaseval = accelval;

            $('#com-chilipeppr-widget-robot-axes-ftr .jogincrements-horiz button').removeClass("hiliteblue");

            if (isCustom) {
                // just tweak the val in red <code> instead of hiliting button
                $('#com-chilipeppr-widget-robot-axes-ftr .jogincrCustomBtn').addClass("hiliteblue");
                this.customOrigVal = this.baseval;
                $('#com-chilipeppr-widget-robot-axes-ftr .jogincrCustomVal').text(accelval);
            } else {
                this.customOrigVal = null;
                //$('#com-chilipeppr-widget-robot-axes-ftr .btnincrements button').removeClass("hiliteblue");
                if (accelval == 1.0) $('#com-chilipeppr-widget-robot-axes-ftr .jogincr1').addClass("hiliteblue");
                if (accelval == 0.1) $('#com-chilipeppr-widget-robot-axes-ftr .jogincrpt1').addClass("hiliteblue");
                if (accelval == 0.01) $('#com-chilipeppr-widget-robot-axes-ftr .jogincrpt01').addClass("hiliteblue");
                if (accelval == 0.001) $('#com-chilipeppr-widget-robot-axes-ftr .jogincrpt001').addClass("hiliteblue");
            }
        },
        accelBaseValUnhilite: function () {
            console.log("accelBaseValUnhilite");
            if (this.customOrigVal != null) {
                // the previous hilite was for custom
                this.customOrigVal = null;
                $('#com-chilipeppr-widget-robot-axes-ftr .jogincrCustomVal').text(this.baseval);
            }
            this.accelBaseval = this.baseval;

            $('#com-chilipeppr-widget-robot-axes-ftr .jogincrements-horiz button').removeClass("hiliteblue");
            //$('#com-chilipeppr-widget-robot-axes-ftr .btnincrements button').removeClass("hiliteblue");
        },
        changeBaseVal: function (evt) {
            console.log("changeBaseVal. data:", evt.data, evt);
            this.baseval = evt.data.newval;
            this.accelBaseval = this.baseval;
            // reset all hilites
            $('#com-chilipeppr-widget-robot-axes-ftr .jogincrements-horiz button').removeClass("hilite");
            $('#com-chilipeppr-widget-robot-axes-ftr .jogincrements-horiz button').removeClass("hiliteblue");
            //$('#com-chilipeppr-widget-robot-axes-ftr .btnincrements button').removeClass("hilite");
            // set new hilite
            $('#com-chilipeppr-widget-robot-axes-ftr ' + evt.data.cls).addClass("hilite");

            // if this was set from a click, then save cookie
            if (evt.type == "click") {
                console.log("saving cookie");
                this.saveOptionsCookie();
            }
        },
        jog: function (direction, isFast, is100xFast, is1000xFast, is10000xFast) {
            var key = direction;
            var cmd = "G91 G0 ";
            var feedrate = 200;
            var mult = 1;
            var xyz = "";
            //var val = 0.001;
            var val = 1.00;
            //var baseval = 1.00;
            var baseval = this.accelBaseval;

            // adjust feedrate relative to acceleration
            //feedrate = feedrate * ((this.accelBaseval / this.baseval) / 2);

            if (key == "Y+") {
                // up arrow. Y+
                xyz = "Y";
                val = baseval; //0.001;
            } else if (key == "Y-") {
                // down arrow. Y-
                xyz = "Y";
                val = -1 * baseval; //0.001;
            } else if (key == "X+") {
                // right arrow. X+
                xyz = "X";
                val = baseval; //0.001;
            } else if (key == "X-") {
                // left arrow. X-
                xyz = "X";
                val = -1 * baseval; //0.001;
            } else if (key == "Z+") {
                // page up. Z+
                xyz = "Z";
                val = baseval; //0.001;
            } else if (key == "Z-") {
                // page down. Z-
                xyz = "Z";
                val = -1 * baseval; //0.001;
            }
            val = val * mult;

            if (xyz.length > 0) {
                //cmd += xyz + val + " F" + feedrate + "\nG90\n";
                cmd += xyz + val + "\nG90\n";
                // do last minute check to see if planner buffer is too full, if so ignore this cmd
                if (!(this.isPausedByPlanner)) {
                    //chilipeppr.publish("/com-chilipeppr-widget-serialport/send", cmd);
                    this.publishSend(cmd);
                } else {
                    console.log("planner buffer full, so not sending jog cmd");
                }
            }
        },
        initBody: function (evt) {
            $('#' + this.id + ' .hidebody').click(this.toggleBody.bind(this));
            var config = localStorage.getItem("/" + this.id + "/body");
            if (config == "visible") this.showBody();
            else this.hideBody();
        },
        toggleBody: function (evt) {
            if ($('#' + this.id + '-body').hasClass('hidden')) this.showBody(evt);
            else this.hideBody(evt);
        },
        showBody: function (evt) {
            $('#' + this.id + '-body').removeClass('hidden');
            $('#' + this.id + '-ftr').removeClass('hidden');
            $('#' + this.id + ' .hidebody span').addClass('glyphicon-chevron-up');
            $('#' + this.id + ' .hidebody span').removeClass('glyphicon-chevron-down');
            if (!(evt == null)) localStorage.setItem("/" + this.id + "/body", "visible");
            $(window).trigger('resize');
        },
        hideBody: function (evt) {
            $('#' + this.id + '-body').addClass('hidden');
            $('#' + this.id + '-ftr').addClass('hidden');
            $('#' + this.id + ' .hidebody span').removeClass('glyphicon-chevron-up');
            $('#' + this.id + ' .hidebody span').addClass('glyphicon-chevron-down');
            if (!(evt == null)) localStorage.setItem("/" + this.id + "/body", "hidden");
        },
        forkSetup: function () {
            //$('#com-chilipeppr-widget-robot-axes-tbar-fork').prop('href', this.fiddleurl);
            //$('#com-chilipeppr-widget-robot-axes-tbar-standalone').prop('href', this.url);
            //$('#com-chilipeppr-widget-robot-axes .fork-name').html(this.id);
            $('#com-chilipeppr-widget-robot-axes .panel-title').popover({
                title: this.name,
                content: this.desc,
                trigger: 'hover',
                placement: "auto",
                html: true,
                delay: 200,
                animation: true
            });

            // load the pubsub viewer / fork element which decorates our upper right pulldown
            // menu with the ability to see the pubsubs from this widget and the forking links
            var that = this;

            chilipeppr.load(
                "http://raw.githubusercontent.com/chilipeppr/widget-pubsubviewer/master/auto-generated-widget.html", 
                // "http://fiddle.jshell.net/chilipeppr/zMbL9/show/light/", 
                function () {
                require(['inline:com-chilipeppr-elem-pubsubviewer'], function (pubsubviewer) {
                    pubsubviewer.attachTo($('#com-chilipeppr-widget-robot-axes .panel-heading .dropdown-menu'), that);
                });
            });

        },
        round: function (num, places) {
            return +(Math.round(num + "e+" + places) + "e-" + places);
        },

    }
});
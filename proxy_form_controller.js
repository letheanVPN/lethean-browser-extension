// interval between each online check. Increase if successfull, decrease if unsuccessfull

var defaultOnlineCheckTimeout = 10000;
var onlineCheckTimeout = 10000;

var onlineTimeoutID = 0; // id of the latest timeout so we can reset it if needed

var defaultStats = "[not available]";


// reset the timeout for validating online
function resetTimeoutOnline() {
	console.log("Clearing timeout ID " + onlineTimeoutID);
	window.clearTimeout(onlineTimeoutID);
	getOnline();
}

// reset intervals between online checks and call the method again
function setOnlineTimerCheck(value) {
	onlineCheckTimeout = value;
	resetTimeoutOnline();
}

// reset intervals between online checks and call the method again
function resetOnlineTimerCheck() {
	onlineCheckTimeout = defaultOnlineCheckTimeout;
	resetTimeoutOnline();
}

// check if extension is online
function getOnline() {
	// keep track of the timeout ID so we can reset it
	onlineTimeoutID = setTimeout(function() {
		var url = "https://geo.geosurf.io/";
		var xmlhttp = new XMLHttpRequest();

		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState != 4) {
				return;
			}

			updateProxyProvider();

			console.log("ready stats 4");
			if (xmlhttp.status == 200) {
				console.log("status 200 google");
				chrome.browserAction.setBadgeText({text: ''});
				chrome.browserAction.setTitle({
					title: chrome.i18n.getMessage('extDescription')
				});

				
				if (window.localStorage['proxyConfig'] != undefined && window.localStorage['proxyConfig'][20] == "f") {
					console.log("status 200 geo surf ip + " + window.localStorage['proxyConfig'][20]);
					var GREEN = [124, 252, 0, 255];
					chrome.browserAction.setBadgeText({text: 'o'});
					chrome.browserAction.setBadgeBackgroundColor({color: GREEN});
					chrome.browserAction.setTitle({
						title: chrome.i18n.getMessage('connectedPopupTitle')
					});
					
					clearErrorDivs();
				}

				var response = JSON.parse(xmlhttp.response);
				
				if (response.ip) {
					setServerIP(response.ip);
				} else {
					setServerIP("Unable to locate");
				}

				// increase interval for checks if last request was successfull and recursively call to the function
				setOnlineTimerCheck(6 * defaultOnlineCheckTimeout);

			}
			else if (xmlhttp.status == 0) {

				// show an alert and disconnect if we are connected and an error is found

				// if this is not an empty array, extension popup is open
				var views = chrome.extension.getViews({ type: "popup" });

        if (views.length != 0) {
					if (document.getElementById("system").hidden == false) {
						// trigger click on disconnect button
						document.getElementById("proxyTypeSystem").click();
						
						// even though we clicked on disconnect, we want to see the try again screen
						generateAlert(chrome.i18n.getMessage('errorProxyError'), false);
						//generateAlert("TEST1", false);
					}
				}
				
				// reset interval for checks if last request was unsuccessfull and recursively call to the function
				resetOnlineTimerCheck();
			}
			
			// hide loading screen, if visible
			if(document.getElementById("loadingScreen") !== null){
				//document.getElementById("loadingScreen").setAttribute("hidden", true);
				document.getElementById('loadingScreen').style.removeProperty("display");
			}
		}

		xmlhttp.open("GET", url, true);
		xmlhttp.timeout = 2500; // time in milliseconds
		xmlhttp.setRequestHeader('Access-Control-Allow-Origin','*');
		xmlhttp.setRequestHeader('Access-Control-Allow-Methods', '*');
		xmlhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
		xmlhttp.send();
		
		
	}, onlineCheckTimeout);
}


function csvToArray( strData, strDelimiter ){
  strDelimiter = (strDelimiter || ",");
  var objPattern = new RegExp(
      (
          // Delimiters.
          "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

          // Quoted fields.
          "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

          // Standard fields.
          "([^\"\\" + strDelimiter + "\\r\\n]*))"
      ),
      "gi"
      );

  var arrData = [[]];

  var arrMatches = null;
  while (arrMatches = objPattern.exec( strData )){

      var strMatchedDelimiter = arrMatches[ 1 ];
      if (
          strMatchedDelimiter.length &&
          strMatchedDelimiter !== strDelimiter
          ){
          arrData.push( [] );

      }

      var strMatchedValue;
      if (arrMatches[ 2 ]){
          strMatchedValue = arrMatches[ 2 ].replace(
              new RegExp( "\"\"", "g" ),
              "\""
              );

      } else {
          strMatchedValue = arrMatches[ 3 ];
      }

      arrData[ arrData.length - 1 ].push( strMatchedValue );
  }
  return( arrData );
}


function timer(time) {
	secs = parseFloat(time)
	var h = secs/60/60
	var m = (secs/60)%60
	var s = secs%60
	var array = [h,m,s].map(Math.floor)
	var value = ''
	for (x = 0; x < array.length; x++) {
		if (array[x] < 10) {
			array[x] = "0" + array[x]
		} else {
			array[x] = array[x]
		}

		function getCom(y) {
			if(y < 2) {
				return ":"
			} else {
				return ""
			}
		}
		var c = getCom(x)
		value = value + array[x] + c
	}
	return value
}


// update connection stats if we are indeed connected
function updateProxyStats() {
	var type = 'Http';

	//console.log(document.getElementById('proxyHost' + type));
	if(document.getElementById('proxyHost' + type) !== null || document.getElementById('proxyPort' + type) !== null){
		var haproxyIp = document.getElementById('proxyHost' + type).value;
		var haproxyPort = parseInt(document.getElementById('proxyPort' + type).value, 10);
	}

	// return and check later if host or port is invalid
	if (haproxyIp == "" || isNaN(haproxyPort)) {
		setTimeout(function() {
			updateProxyStats();
		}, 5000);

		return;
	}

	var url = "http://" + haproxyIp + ":8181/stats;csv";	
	var xmlhttp = new XMLHttpRequest();

	// get every seconds from haproxy info about donwload/upload/time online
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			//parse donwload and upload haproxy stats from /stats;csv
			var haproxyStats = csvToArray(xmlhttp.responseText);
			haproxyStats = JSON.stringify(haproxyStats[1]);
			haproxyStats = haproxyStats.split(',');
			haproxyStats[8] = haproxyStats[8].replace('"', '');
			haproxyStats[9] = haproxyStats[9].replace('"', '');

			var data = "Down: " + formatBytes(parseInt(haproxyStats[9])) + " Up: " + formatBytes(parseInt(haproxyStats[8]));
			haproxyStats = csvToArray(xmlhttp.responseText);
			haproxyStats = JSON.stringify(haproxyStats[3]);
			haproxyStats = haproxyStats.split(',');
			haproxyStats[23] = haproxyStats[23].replace('"', '');

			var timeOnline = haproxyStats[23];

			setConnectionData(timeOnline, data);

			getOnline();
			setTimeout(function() {
				updateProxyStats();

			}, 5000);

		} else if (xmlhttp.status != 200 && xmlhttp.readyState == 4) {
			if (window.localStorage['proxyConfig'] != undefined && window.localStorage['proxyConfig'][20] != "s") {
				// Badge the popup icon.
				var RED = [255, 0, 0, 255];
				chrome.browserAction.setBadgeBackgroundColor({color: RED});
				chrome.browserAction.setBadgeText({text: 'X'});
				chrome.browserAction.setTitle({
					title: chrome.i18n.getMessage('errorPopupTitle')
				});
			}
		}
	}

	xmlhttp.open("GET", url, true);
	xmlhttp.timeout = 2000; // time in milliseconds
	xmlhttp.setRequestHeader('Access-Control-Allow-Origin','*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Methods', '*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
	xmlhttp.send();
}

// get service and provider name to show on dashboard screen
function updateProxyProvider() {
	var urlProvider = "http://127.0.0.1:8182/provider";
	var xmlhttpProvider = new XMLHttpRequest();
	xmlhttpProvider.onreadystatechange=function() {
		if (xmlhttpProvider.readyState == 4 && xmlhttpProvider.status == 200) {
			var providerStats = JSON.parse(xmlhttpProvider.responseText);
			setConnectionProvider(providerStats.provider, providerStats.service);
		} else if (xmlhttpProvider.status != 200 && xmlhttpProvider.readyState == 4) {
			if (window.localStorage['proxyConfig'] != undefined && window.localStorage['proxyConfig'][20] != "s") {
				// Badge the popup icon.
				var RED = [255, 0, 0, 255];
				chrome.browserAction.setBadgeBackgroundColor({color: RED});
				chrome.browserAction.setBadgeText({text: 'X'});
				chrome.browserAction.setTitle({
					title: chrome.i18n.getMessage('errorPopupTitle')
				});
			}
		}
	}

	xmlhttpProvider.open("GET", urlProvider, true);
	xmlhttpProvider.timeout = 2000; // time in milliseconds
	xmlhttpProvider.setRequestHeader("Access-Control-Allow-Origin","*");
	xmlhttpProvider.setRequestHeader('Access-Control-Allow-Methods', '*');
	xmlhttpProvider.setRequestHeader('Access-Control-Allow-Headers', '*');
	xmlhttpProvider.send();
}


// updates values in the connection screen
function updateConnectedScreenStats() {
	if (document.getElementById('providerName') !== null) {
		document.getElementById('providerName').innerHTML = localStorage.getItem('stats_provider');
	}
	
	if (document.getElementById('serviceName') !== null) {
		document.getElementById('serviceName').innerHTML = localStorage.getItem('stats_service');
	}
	
	if (document.getElementById('timeOnline') !== null) {
		var time = localStorage.getItem('stats_time');
		if (isNaN(parseInt(time))) {
			time = 1;
		}
		document.getElementById('timeOnline').innerHTML = timer(time);
		// increase local timer
		localStorage.setItem('stats_time', parseInt(time) + 1);
	}
	
	if (document.getElementById('serverIP') !== null) {
		document.getElementById('serverIP').innerHTML = localStorage.getItem('stats_ip');  
	}
	
	if (document.getElementById('dataTransferred') !== null) {
		document.getElementById('dataTransferred').innerHTML = localStorage.getItem('stats_transfer');
	}
	
	
	setTimeout(function() {
		updateConnectedScreenStats();
	}, 1000);
}

function setServerIP(ip) {
	// if fields are empty, set them as not available
	if (ip == "") {
		ip = defaultStats;
	}
	
	localStorage.setItem('stats_ip', ip);
}


// sets the values from the connection status
function setConnectionData(timeOnline, dataTransferred) {
	// if fields are empty, set them as not available
	if (timeOnline == "") {
		timeOnline = 0;
	}
	
	if (dataTransferred == "") {
		dataTransferred = defaultStats;
	}
	
	localStorage.setItem('stats_time', timeOnline);
	localStorage.setItem('stats_transfer', dataTransferred);
}

// sets the values from the provider information
function setConnectionProvider(providerName, serviceName) {
	
	// if fields are empty, set them as not available
	if (providerName == "") {
		providerName = defaultStats;
	}
	
	if (serviceName == "") {
		serviceName = defaultStats;
	}
	
	localStorage.setItem('stats_provider', providerName);
	localStorage.setItem('stats_service', serviceName);
}

// format a bytes number depending on the amount
function formatBytes(bytes,decimals) {
  if (bytes == 0) return '0 Bytes';
  var k = 1000,
	  dm = decimals || 2,
	  sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
	  i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


// activate method to check if we are online
resetOnlineTimerCheck();

// timeout loop to update proxy stats
updateProxyStats();

// timeout loop to update proxy provider
updateProxyProvider();

// update stats screen based on existing local storage
updateConnectedScreenStats();

var ProxyFormController = function(id) {

	this.form_ = document.getElementById(id);

	// Throw an error if the element either doesn't exist, or isn't a form.
	if (!this.form_)
		throw chrome.i18n.getMessage('errorIdNotFound', id);
	else if (this.form_.nodeName !== 'FORM')
		throw chrome.i18n.getMessage('errorIdNotForm', id);

	/**
	* Cached references to the `fieldset` groups that define the configuration
	* options presented to the user.
	*
	* @type {NodeList}
	* @private
	*/
	this.configGroups_ = document.querySelectorAll('#' + id + ' > fieldset');

	this.bindEventHandlers_();
	this.readCurrentState_();

	// Handle errors
	this.handleProxyErrors_();
};


///////////////////////////////////////////////////////////////////////////////

/**
 * The proxy types we're capable of handling.
 * @enum {string}
 */
ProxyFormController.ProxyTypes = {
	AUTO: 'auto_detect',
	FIXED: 'fixed_servers',
	SYSTEM: 'system'
};

/**
 * The window types we're capable of handling.
 * @enum {int}
 */
ProxyFormController.WindowTypes = {
	REGULAR: 1,
	INCOGNITO: 2
};

/**
 * The extension's level of control of Chrome's roxy setting
 * @enum {string}
 */
ProxyFormController.LevelOfControl = {
	NOT_CONTROLLABLE: 'not_controllable',
	OTHER_EXTENSION: 'controlled_by_other_extension',
	AVAILABLE: 'controllable_by_this_extension',
	CONTROLLING: 'controlled_by_this_extension'
};

/**
 * The response type from 'proxy.settings.get'
 *
 * @typedef {{value: ProxyConfig,
 *     levelOfControl: ProxyFormController.LevelOfControl}}
 */
ProxyFormController.WrappedProxyConfig;

///////////////////////////////////////////////////////////////////////////////

/**
 * Retrieves proxy settings that have been persisted across restarts.
 *
 * @return {?ProxyConfig} The persisted proxy configuration, or null if no
 *     value has been persisted.
 * @static
 */
ProxyFormController.getPersistedSettings = function() {
	var result = null;
	if (window.localStorage['proxyConfig'] !== undefined)   
		result = JSON.parse(window.localStorage['proxyConfig']);
	return result ? result : null;
};


/**
 * Persists proxy settings across restarts.
 *
 * @param {!ProxyConfig} config The proxy config to persist.
 * @static
 */
ProxyFormController.setPersistedSettings = function(config) {
	console.log("Storing Settings");
	console.log(config);
	window.localStorage['proxyConfig'] = JSON.stringify(config);
};

///////////////////////////////////////////////////////////////////////////////

ProxyFormController.prototype = {
	/**
	* The form's current state.
	* @type {regular: ?ProxyConfig, incognito: ?ProxyConfig}
	* @private
	*/
	config_: {regular: null, incognito: null},

	/**
	* Do we have access to incognito mode?
	* @type {boolean}
	* @private
	*/
	isAllowedIncognitoAccess_: false,


	/**
	* @return {Array<string>} A list of hostnames that should bypass the proxy.
	*/
	get bypassList() {
		console.log("bypasslist");
		return ["<local>"];

		//return document.getElementById('bypassList').value.split(/\s*(?:,|^)\s*/m);
	},


	/**
	* @param {?Array<string>} data A list of hostnames that should bypass
	*     the proxy. If empty, the bypass list is emptied.
	*/
	set bypassList(data) {
		if (!data)
			data = [];
		document.getElementById('bypassList').value = data.join(', ');
	},


	/**
	* @see http://code.google.com/chrome/extensions/trunk/proxy.html
	* @return {?ProxyServer} An object containing the proxy server host, port,
	*     and scheme. If null, there is no single proxy.
	*/
	get singleProxy() {
		//document.getElementById('singleProxyForEverything').checked = true;
		//var checkbox = document.getElementById('singleProxyForEverything');
		return this.httpProxy
		//return checkbox.checked ? this.httpProxy : null;
	},


	/**
	* @see http://code.google.com/chrome/extensions/trunk/proxy.html
	* @param {?ProxyServer} data An object containing the proxy server host,
	*     port, and scheme. If null, the single proxy checkbox will be unchecked.
	*/

	/**
	* @return {?ProxyServer} An object containing the proxy server host, port
	*     and scheme.
	*/
	get httpProxy() {
		return this.getProxyImpl_('Http');
	},


	/**
	* @param {?ProxyServer} data An object containing the proxy server host,
	*     port, and scheme. If empty, empties the proxy setting.
	*/
	set httpProxy(data) {
		this.setProxyImpl_('Http', data);
	},


	/**
	* @return {?ProxyServer} An object containing the proxy server host, port
	*     and scheme.
	*/
	get httpsProxy() {
		return this.getProxyImpl_('Https');
	},


	/**
	* @param {?ProxyServer} data An object containing the proxy server host,
	*     port, and scheme. If empty, empties the proxy setting.
	*/
	set httpsProxy(data) {
		this.setProxyImpl_('Https', data);
	},


	/**
	* @return {?ProxyServer} An object containing the proxy server host, port
	*     and scheme.
	*/
	get ftpProxy() {
		return this.getProxyImpl_('Ftp');
	},


	/**
	* @param {?ProxyServer} data An object containing the proxy server host,
	*     port, and scheme. If empty, empties the proxy setting.
	*/
	set ftpProxy(data) {
		this.setProxyImpl_('Ftp', data);
	},


	/**
	* @return {?ProxyServer} An object containing the proxy server host, port
	*     and scheme.
	*/
	get fallbackProxy() {
		return this.getProxyImpl_('Fallback');
	},


	/**
	* @param {?ProxyServer} data An object containing the proxy server host,
	*     port, and scheme. If empty, empties the proxy setting.
	*/
	set fallbackProxy(data) {
		this.setProxyImpl_('Fallback', data);
	},


	/**
	* @param {string} type The type of proxy that's being set ("Http",
	*     "Https", etc.).
	* @return {?ProxyServer} An object containing the proxy server host,
	*     port, and scheme.
	* @private
	*/
	getProxyImpl_: function(type) {
		var result = {
			scheme: document.getElementById('proxyScheme' + type).value,
			host: document.getElementById('proxyHost' + type).value,
			port: parseInt(document.getElementById('proxyPort' + type).value, 10)
		};
		return (result.scheme && result.host && result.port) ? result : undefined;
	},


	/**
	* A generic mechanism for setting proxy data.
	*
	* @see http://code.google.com/chrome/extensions/trunk/proxy.html
	* @param {string} type The type of proxy that's being set ("Http",
	*     "Https", etc.).
	* @param {?ProxyServer} data An object containing the proxy server host,
	*     port, and scheme. If empty, empties the proxy setting.
	* @private
	*/
	setProxyImpl_: function(type, data) {
		if (!data) data = {scheme: 'http', host: '', port: ''};

		document.getElementById('proxyScheme' + type).value = data.scheme;
		document.getElementById('proxyHost' + type).value = data.host;
		document.getElementById('proxyPort' + type).value = data.port;
	},

	///////////////////////////////////////////////////////////////////////////////

	/**
	* Calls the proxy API to read the current settings, and populates the form
	* accordingly.
	*
	* @private
	*/
	readCurrentState_: function() {
		chrome.extension.isAllowedIncognitoAccess(this.handleIncognitoAccessResponse_.bind(this));
	},

	/**
	* Handles the respnse from `chrome.extension.isAllowedIncognitoAccess`
	* We can't render the form until we know what our access level is, so
	* we wait until we have confirmed incognito access levels before
	* asking for the proxy state.
	*
	* @param {boolean} state The state of incognito access.
	* @private
	*/
	handleIncognitoAccessResponse_: function(state) {
		this.isAllowedIncognitoAccess_ = state;
		chrome.proxy.settings.get({incognito: false},
		this.handleRegularState_.bind(this));
		if (this.isAllowedIncognitoAccess_) {
			chrome.proxy.settings.get({incognito: true}, this.handleIncognitoState_.bind(this));
		}
	},

	/**
	* Handles the response from 'proxy.settings.get' for regular
	* settings.
	*
	* @param {ProxyFormController.WrappedProxyConfig} c The proxy data and
	*     extension's level of control thereof.
	* @private
	*/
	handleRegularState_: function(c) {
		if (c.levelOfControl === ProxyFormController.LevelOfControl.AVAILABLE ||
			c.levelOfControl === ProxyFormController.LevelOfControl.CONTROLLING) {
			this.recalcFormValues_(c.value);
			this.config_.regular = c.value;
		} else {
			this.handleLackOfControl_(c.levelOfControl);
		}
	},

	/**
	* Handles the response from 'proxy.settings.get' for incognito
	* settings.
	*
	* @param {ProxyFormController.WrappedProxyConfig} c The proxy data and
	*     extension's level of control thereof.
	* @private
	*/
	handleIncognitoState_: function(c) {
		if (c.levelOfControl === ProxyFormController.LevelOfControl.AVAILABLE || c.levelOfControl === ProxyFormController.LevelOfControl.CONTROLLING) {
			if (this.isIncognitoMode_()) this.recalcFormValues_(c.value);

			this.config_.incognito = c.value;
		} else {
				this.handleLackOfControl_(c.levelOfControl);
		}
	},

	/**
	* Binds event handlers for the various bits and pieces of the form that
	* are interesting to the controller.
	*
	* @private
	*/
	bindEventHandlers_: function() {
		this.form_.addEventListener('click', this.dispatchFormClick_.bind(this));
	},


	/**
	* When a `click` event is triggered on the form, this function handles it by
	* analyzing the context, and dispatching the click to the correct handler.
	*
	* @param {Event} e The event to be handled.
	* @private
	* @return {boolean} True if the event should bubble, false otherwise.
	*/
	dispatchFormClick_: function(e) {
		var t = e.target;

		console.log('dispatchFormClick_ ' + t);

		// Case 1: "Apply"
		if (t.nodeName === 'BUTTON' && t.getAttribute('type') === 'submit') {
			while (t && (t.nodeName !== 'FIELDSET' || t.parentNode.nodeName !== 'FORM')) {
				t = t.parentNode;
			}
			if (t) {
				return this.applyChanges_(e);
			}

		} else {
		// Walk up the tree until we hit `form > fieldset` or fall off the top
			while (t && (t.nodeName !== 'FIELDSET' ||
				t.parentNode.nodeName !== 'FORM')) {
				t = t.parentNode;
			}
			if (t) {
				this.changeActive_(t);
			}
		}

		return true;
	},


	/**
	* Sets the form's active config group.
	*
	* @param {DOMElement} fieldset The configuration group to activate.
	* @private
	*/
	changeActive_: function(fieldset) {
		for (var i = 0; i < this.configGroups_.length; i++) {
			var el = this.configGroups_[i];
			var radio = el.querySelector("input[type='radio']");
			if (el === fieldset) {
				el.classList.add('active');
				radio.checked = true;
			} else {
				el.classList.remove('active');
			}
		}

		this.recalcDisabledInputs_();
	},


	/**
	* Recalculates the `disabled` state of the form's input elements, based
	* on the currently active group, and that group's contents.
	*
	* @private
	*/
	recalcDisabledInputs_: function() {
		var i, j;
		for (i = 0; i < this.configGroups_.length; i++) {
			var el = this.configGroups_[i];
			var inputs = el.querySelectorAll(
			"input:not([type='radio']), select, textarea");
			if (el.classList.contains('active')) {
				for (j = 0; j < inputs.length; j++) {
					inputs[j].removeAttribute('disabled');
					console.log(inputs[j].id)
				}

			} else {
				for (j = 0; j < inputs.length; j++) {
					inputs[j].setAttribute('disabled', 'disabled');
				}
			}
		}
	},


	/**
	* Handler called in response to click on form's submission button. Generates
	* the proxy configuration and passes it to `useCustomProxySettings`, or
	* handles errors in user input.
	*
	* Proxy errors (and the browser action's badge) are cleared upon setting new
	* values.
	*
	* @param {Event} e DOM event generated by the user's click.
	* @private
	*/
	applyChanges_: function(e) {
		console.log("applyChanges_ start");
		console.log(e);

		e.preventDefault();
		e.stopPropagation();

		if (this.isIncognitoMode_())
			this.config_.incognito = this.generateProxyConfig_();
		else
			this.config_.regular = this.generateProxyConfig_();

		chrome.proxy.settings.set({value: this.config_.regular, scope: 'regular'}, this.callbackForRegularSettings_.bind(this));
		chrome.extension.sendRequest({type: 'clearError'});
	},

	/**
	* Called in response to setting a regular window's proxy settings: checks
	* for `lastError`, and then sets incognito settings (if they exist).
	*
	* @private
	*/
	callbackForRegularSettings_: function() {
			if (chrome.runtime.lastError) {
			this.generateAlert_(chrome.i18n.getMessage('errorSettingRegularProxy'), true);
			//this.generateAlert_("TEST2", true);

			// trigger click on disconnect button
			document.getElementById("proxyTypeSystem").click();

			return;
		}
		if (this.config_.incognito) {
			chrome.proxy.settings.set({value: this.config_.incognito, scope: 'incognito_persistent'}, this.callbackForIncognitoSettings_.bind(this));
		} else {
			ProxyFormController.setPersistedSettings(this.config_);
		}
	},

	/**
	* Called in response to setting an incognito window's proxy settings: checks
	* for `lastError` and sets a success message.
	*
	* @private
	*/
	callbackForIncognitoSettings_: function() {
		if (chrome.runtime.lastError) {
			this.generateAlert_(chrome.i18n.getMessage('errorSettingIncognitoProxy'));
			//this.generateAlert_("TEST3");
			return;
		}
		ProxyFormController.setPersistedSettings(this.config_);
	},

	/**
	* Generates an alert overlay inside the proxy's popup, then closes the popup
	* after a short delay.
	*
	* @param {string} msg The message to be displayed in the overlay.
	* @param {?boolean} close Should the window be closed?  Defaults to true.
	* @private
	*/
	generateAlert_: function(msg, close) {
		generateAlert(msg, close);
	},


	/**
	* Parses the proxy configuration form, and generates a ProxyConfig object
	* that can be passed to `useCustomProxyConfig`.
	*
	* @see http://code.google.com/chrome/extensions/trunk/proxy.html
	* @return {ProxyConfig} The proxy configuration represented by the form.
	* @private
	*/
	generateProxyConfig_: function() {
		var active = document.getElementsByClassName('active')[0];
		switch (active.id) {
			case ProxyFormController.ProxyTypes.SYSTEM:
				return {mode: 'system'};
			case ProxyFormController.ProxyTypes.FIXED:
				var config = {mode: 'fixed_servers'};
				config.rules = {singleProxy: this.singleProxy, bypassList: this.bypassList};
			return config;
		}
	},


	/**
	* Sets the proper display classes based on the "Use the same proxy server
	* for all protocols" checkbox. Expects to be called as an event handler
	* when that field is clicked.
	*
	* @param {Event} e The `click` event to respond to.
	* @private
	*/
	toggleSingleProxyConfig_: function(e) {
		var checkbox = e.target;

		checkbox.parentNode.parentNode.classList.add('single');
	},


	/**
	* Returns the form's current incognito status.
	*
	* @return {boolean} True if the form is in incognito mode, false otherwise.
	* @private
	*/
	isIncognitoMode_: function(e) {
		return this.form_.parentNode.classList.contains('incognito');
	},


	/**
	* Toggles the form's incognito mode. Saves the current state to an object
	* property for later use, clears the form, and toggles the appropriate state.
	*
	* @param {Event} e The `click` event to respond to.
	* @private
	*/
	toggleIncognitoMode_: function(e) {
		var div = this.form_.parentNode;
		var button = document.getElementsByTagName('button')[0];

		// Cancel the button click.
		e.preventDefault();
		e.stopPropagation();

		// If we can't access Incognito settings, throw a message and return.
		if (!this.isAllowedIncognitoAccess_) {
			var msg = "I'm sorry, I'm afraid I can't do that. Give me access " +
			"to Incognito settings by checking the checkbox labeled " +
			"'Allow in Incognito mode', which is visible at " +
			"chrome://extensions.";
			this.generateAlert_(msg, false);
			return;
		}

		if (this.isIncognitoMode_()) {
			// In incognito mode, switching to cognito.
			this.config_.incognito = this.generateProxyConfig_();
			div.classList.remove('incognito');
			this.recalcFormValues_(this.config_.regular);
			button.innerText = 'Configure incognito window settings.';
		} else {
			// In cognito mode, switching to incognito.
			this.config_.regular = this.generateProxyConfig_();
			div.classList.add('incognito');
			this.recalcFormValues_(this.config_.incognito);
			button.innerText = 'Configure regular window settings.';
		}
	},


	/**
	* Sets the form's values based on a ProxyConfig.
	*
	* @param {!ProxyConfig} c The ProxyConfig object.
	* @private
	*/
	recalcFormValues_: function(c) {
		// Activate one of the groups, based on `mode`.
		this.changeActive_(document.getElementById(c.mode));

		// Evaluate the `rules`
		if (c.rules) {
			var rules = c.rules;
			//if (rules.singleProxy) {
			this.singleProxy = rules.singleProxy;
			this.bypassList = rules.bypassList;
		} else {
			this.singleProxy = null;
			this.httpProxy = null;
			this.httpsProxy = null;
			this.ftpProxy = null;
			this.fallbackProxy = null;
			this.bypassList = '';
		}
	},


	/**
	* Handles the case in which this extension doesn't have the ability to
	* control the Proxy settings, either because of an overriding policy
	* or an extension with higher priority.
	*
	* @param {ProxyFormController.LevelOfControl} l The level of control this
	*     extension has over the proxy settings.
	* @private
	*/
	handleLackOfControl_: function(l) {
		var msg;
		if (l === ProxyFormController.LevelOfControl.NO_ACCESS)
			msg = chrome.i18n.getMessage('errorNoExtensionAccess');
		else if (l === ProxyFormController.LevelOfControl.OTHER_EXTENSION)
			msg = chrome.i18n.getMessage('errorOtherExtensionControls');
		this.generateAlert_(msg);
	},


	/**
	* Handle the case in which errors have been generated outside the context
	* of this popup.
	*
	* @private
	*/
	handleProxyErrors_: function() {
		chrome.extension.sendRequest({type: 'getError'}, this.handleProxyErrorHandlerResponse_.bind(this));
	},

	/**
	* Handles response from ProxyErrorHandler
	*
	* @param {{result: !string}} response The message sent in response to this
	*     popup's request.
	*/
	handleProxyErrorHandlerResponse_: function(response) {

		if (response.result !== null) {
			var error = JSON.parse(response.result);

			// ignore, sometimes we get temporary tunnel connections failed but proxy is working
			if (error.error == "net::ERR_TUNNEL_CONNECTION_FAILED") {
				return;
			}

			this.generateAlert_(chrome.i18n.getMessage(error.details ? 'errorProxyDetailedError' : 'errorProxyError',[error.error, error.details]),false);
		}
	}
};


// remove any existing error div if there is one
function clearErrorDivs() {
	var existingError = document.getElementById("proxyFail");
	if (existingError != null) {
		existingError.remove();
	}
}

function generateAlert(msg, close) {

	console.log("generateAlert");

	// delete all existing and opened alerts
	var els = document.getElementsByClassName('overlay');

	while (els[0]) {
		els[0].classList.remove('active')
	}

	clearErrorDivs();

	var success = document.createElement('div');
	success.setAttribute('id', 'proxyFail');

	if (close == true) {
		success.classList.add('overlay');
	} else {
		success.removeAttribute('hidden', 'hidden');
		success.classList.add('proxyFailMsg');
	}

	success.setAttribute('role', 'alert');
	success.textContent = msg;

	// switch visible sections, hiding welcome screen and showing the other where error is shown
	if (document.getElementById("imgError") !== null) {

		// Badge the popup icon.
		var RED = [255, 0, 0, 255];
		chrome.browserAction.setBadgeBackgroundColor({color: RED});
		chrome.browserAction.setBadgeText({text: 'X'});
		chrome.browserAction.setTitle({
			title: chrome.i18n.getMessage('errorPopupTitle')
		});

		document.getElementById("imgError").removeAttribute('hidden', 'hidden');
		document.getElementById("dataValue").setAttribute('hidden', 'hidden');
		document.getElementById("settingsConfig").setAttribute('hidden', 'hidden');
		document.getElementById("fixed_servers").setAttribute('hidden', 'hidden');
		document.getElementById("system").removeAttribute('hidden', 'hidden');
		document.getElementById("dataValue").setAttribute('hidden', 'hidden');
		document.getElementById("connectedMsg").innerHTML = "CONNECTION ERROR";
		document.getElementById("tryAgainMsg").innerHTML = "TRY AGAIN";
	}
	

	document.body.appendChild(success);

	setTimeout(function() { success.classList.add('visible'); }, 10);

	setTimeout(function() {
		if (close == true) {
			success.setAttribute('hidden', 'hidden');
		}
		success.classList.remove('overlay');
	}, 4000);
}
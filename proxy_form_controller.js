function getOnline(){
    setTimeout(function(){
    var url = "https://geoip.nekudo.com/api/"
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
              chrome.browserAction.setBadgeText({text: ''});
              chrome.browserAction.setTitle({
              title: chrome.i18n.getMessage('extDescription')
            });
          if(window.localStorage['proxyConfig'][20] == "f"){
            var GREEN = [124, 252, 0, 255];
            chrome.browserAction.setBadgeText({text: 'o'});
            chrome.browserAction.setBadgeBackgroundColor({color: GREEN});
            chrome.browserAction.setTitle({
              title: chrome.i18n.getMessage('connectedPopupTitle')
            });
            document.getElementById('proxyFail').setAttribute('hidden', 'hidden');
          }
        }
    }
    xmlhttp.open("GET", url, true);
    xmlhttp.setRequestHeader('Access-Control-Allow-Origin','*');
    xmlhttp.setRequestHeader('Access-Control-Allow-Methods', '*');
    xmlhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
    xmlhttp.send();
    getOnline();
  },5000);
}

getOnline();

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
    return document.getElementById('bypassList').value.split(/\s*(?:,|^)\s*/m);
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
    if (!data)
      data = {scheme: 'http', host: '', port: ''};

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
    chrome.extension.isAllowedIncognitoAccess(
        this.handleIncognitoAccessResponse_.bind(this));
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
      chrome.proxy.settings.get({incognito: true},
          this.handleIncognitoState_.bind(this));
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
    if (c.levelOfControl === ProxyFormController.LevelOfControl.AVAILABLE ||
        c.levelOfControl === ProxyFormController.LevelOfControl.CONTROLLING) {
      if (this.isIncognitoMode_())
        this.recalcFormValues_(c.value);

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

    e.preventDefault();
    e.stopPropagation();

    if (this.isIncognitoMode_())
      this.config_.incognito = this.generateProxyConfig_();
    else
      this.config_.regular = this.generateProxyConfig_();

    chrome.proxy.settings.set(
        {value: this.config_.regular, scope: 'regular'},
        this.callbackForRegularSettings_.bind(this));
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
	  
	  // trigger click on disconnect button
	  $("#proxyTypeSystem").click();
      
      return;
    }
    if (this.config_.incognito) {
      chrome.proxy.settings.set(
          {value: this.config_.incognito, scope: 'incognito_persistent'},
          this.callbackForIncognitoSettings_.bind(this));
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
	// delete all existing and opened alerts
	$('.overlay').remove();

	  
    var success = document.createElement('div');
    success.setAttribute('id','proxyFail');
    
    if(close == true){
      success.classList.add('overlay');
    }else{
      success.removeAttribute('hidden', 'hidden');
      success.classList.add('proxyFailMsg');
    }
    success.setAttribute('role', 'alert');
    //msg = msg.replace(".", ".                                                                                                                                  ");
    success.textContent = msg;
    document.getElementById("connectedMsg").innerText = "CONNECTION ERROR";
    document.getElementById("tryAgainMsg").innerText = "TRY AGAIN";
    document.getElementById("imgError").removeAttribute('hidden', 'hidden');
    document.getElementById("dataValue").setAttribute('hidden', 'hidden');
    document.body.appendChild(success);

    setTimeout(function() { success.classList.add('visible'); }, 10);

    setTimeout(function() {
        if(close == true){
          success.setAttribute('hidden', 'hidden');
        }
        success.classList.remove('overlay');
    }, 4000);

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
          config.rules = {
            singleProxy: this.singleProxy,
            bypassList: this.bypassList
          };
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
      var msg = "I'm sorry, Dave, I'm afraid I can't do that. Give me access " +
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
    
    console.log("Mode " + c.mode);
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
   chrome.extension.sendRequest(
    {type: 'getError'},
    this.handleProxyErrorHandlerResponse_.bind(this));
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
      this.generateAlert_(
          chrome.i18n.getMessage(
              error.details ? 'errorProxyDetailedError' : 'errorProxyError',
              [error.error, error.details]),
          false);
    }
  }
};

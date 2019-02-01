$(document).ready(function() {
	
	var defaultHost = "localhost";
	var defaultPort = "8180";
	
	var defaultStats = "[not available]";

	var url = "http://geo.geosurf.io/";
	var xmlhttp = new XMLHttpRequest();

	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.status != 200 && window.localStorage['proxyConfig'][20] != "s") {

			// Badge the popup icon.
			var RED = [255, 0, 0, 255];
			chrome.browserAction.setBadgeBackgroundColor({color: RED});
			chrome.browserAction.setBadgeText({text: 'X'});
			chrome.browserAction.setTitle({
				title: chrome.i18n.getMessage('errorPopupTitle')
			});

			// delete all existing and opened alerts
			var els = document.getElementsByClassName('overlay');

			while (els[0]) {
			els[0].classList.remove('active')
			}

			clearErrorDivs();

			var success = document.createElement('div');
			success.setAttribute('id', 'proxyFail');

			if(close == true){
			success.classList.add('overlay');
			}
			else{
			success.removeAttribute('hidden', 'hidden');
			success.classList.add('proxyFailMsg');
			}
			success.setAttribute('role', 'alert');

			success.textContent = chrome.i18n.getMessage('errorProxyError');

			document.getElementById("connectedMsg").innerText = "CONNECTION ERROR";
			document.getElementById("tryAgainMsg").innerText = "TRY AGAIN";
			document.getElementById("imgError").removeAttribute('hidden', 'hidden');
			document.getElementById("dataValue").setAttribute('hidden', 'hidden');

			document.getElementById("settingsConfig").setAttribute('hidden', 'hidden');

			// switch visible sections, hiding welcome screen and showing the other where error is shown
			document.getElementById("fixed_servers").setAttribute('hidden', 'hidden');
			document.getElementById("system").removeAttribute('hidden', 'hidden');

			document.getElementById("dataValue").setAttribute('hidden', 'hidden');

			document.body.appendChild(success);

			setTimeout(function() { success.classList.add('visible'); }, 10);
		}
	}
	
	if (window.localStorage['proxyConfig'] == undefined || window.localStorage['proxyConfig'][20] == "s") {
		console.log("Local Storage does not exist");
		$("#system").attr("hidden", "hidden");
		$("#fixed_servers").removeAttr("hidden");
		$(".proxyFailMsg").removeClass('visible');
		$(".proxyFailMsg").addClass('nonDisplay');
		$("#settingsConfig").removeAttr("hidden");
	}
	else{
		$("#fixed_servers").attr("hidden", "hidden");
		$("#system").removeAttr("hidden");
		$("#settingsConfig").attr("hidden", "hidden");
	}
	
	// set default value in storage
	if (localStorage.getItem('proxyHost') == null) {
		localStorage.setItem('proxyHost', defaultHost);
	}
	if (localStorage.getItem('proxyPort') == null) {
		localStorage.setItem('proxyPort', defaultPort);
	}
	
	// set default connection stats values in storage
	if (localStorage.getItem('stats_provider') == null) {
		localStorage.setItem('stats_provider', defaultStats);
	}
	if (localStorage.getItem('stats_service') == null) {
		localStorage.setItem('stats_service', defaultStats);
	}
	if (localStorage.getItem('stats_time') == null) {
		localStorage.setItem('stats_time', 0);
	}
	if (localStorage.getItem('stats_ip') == null) {
		localStorage.setItem('stats_ip', defaultStats);
	}
	if (localStorage.getItem('stats_transfer') == null) {
		localStorage.setItem('stats_transfer', defaultStats);
	}
	
	// load form fields with values from storage
	document.getElementById('proxyHostHttp').value = localStorage.getItem('proxyHost');
    document.getElementById('proxyPortHttp').value = localStorage.getItem('proxyPort');
	
	console.log("Local Storage Exists");
	console.log(localStorage.getItem('proxyHost'));
	console.log(localStorage.getItem('proxyPort'));
	
	// fill in default value for host if empty
	if (document.getElementById('proxyHostHttp').value == "") {
		document.getElementById('proxyHostHttp').value = defaultHost;
	}
	
	// fill in default value for port if empty
	if (document.getElementById('proxyPortHttp').value == "") {
		document.getElementById('proxyPortHttp').value = defaultPort;
	}

	
	// disconnect click
	$('input[id=proxyTypeSystem]').click(function() {
		console.log("Disconnect Clicked");
	
		$("#system").attr("hidden", "hidden");
		$("#imgError").attr("hidden", "hidden");
		$("#dataValue").removeAttr("hidden");
		$("#fixed_servers").removeAttr("hidden");
		$(".proxyFailMsg").removeClass('visible');
		$(".proxyFailMsg").addClass('nonDisplay');
		$("#settingsConfig").removeAttr("hidden");
		document.getElementById('proxyHostHttp').value = defaultHost;
        document.getElementById('proxyPortHttp').value = defaultPort;
        document.getElementById("connectedMsg").innerText = "CONNECTED";
        document.getElementById("tryAgainMsg").innerText = "DISCONNECT";
	});
	
	
	// connect click
	$('input[id=proxyTypeManual]').click(function() {
		
		// show loading screen
		$("#loadingScreen").show();
		
		console.log("Connect Clicked");
	
		$("#fixed_servers").attr("hidden", "hidden");
		$("#system").removeAttr("hidden");
		$("#settingsConfig").attr("hidden", "hidden");
		$("#dataValue").removeAttr("hidden");
		$("#imgError").attr("hidden", "hidden");
		
		// reset the timer check to its default value when connecting or reconnecting
		resetOnlineTimerCheck();
	});
	
	
	// catch host change so we can store it to localStorage
	var lastHostValue = '';
	$("#proxyHostHttp").on('change keyup paste mouseup', function() {
		if ($(this).val() != lastHostValue) {
			lastHostValue = $(this).val();
			console.log('Host updated to ' + lastHostValue);
			localStorage.setItem('proxyHost', lastHostValue);
		}
	});
	
	// catch port change so we can store it to localStorage
	var lastPortValue = '';
	$("#proxyPortHttp").on('change keyup paste mouseup', function() {
		if ($(this).val() != lastPortValue) {
			lastPortValue = $(this).val();
			console.log('Port updated to ' + lastPortValue);
			localStorage.setItem('proxyPort', lastPortValue);
		}
	});

	var flag = 2
	$("#settingsConfig").click(function(){

		if(flag == 2){
			$("#proxyHost").show();
			flag = 1;
		}else{
			$("#proxyHost").hide();
			flag = 2;
		}
	});


	xmlhttp.open("GET", url, true);
	xmlhttp.timeout = 2500; // time in milliseconds
	xmlhttp.setRequestHeader('Access-Control-Allow-Origin','*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Methods', '*');
	xmlhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
	xmlhttp.send();

	// make following action fire when radio button changes
    $('input[type=radio]').click(function(){
    	if(document.getElementById('proxyHostHttp').value.length < 1 && document.getElementById('proxyPortHttp').value.length < 1){
    		document.getElementById('proxyHostHttp').value = "127.0.0.1";
    		document.getElementById('proxyPortHttp').value = "8180";
    	}
    	setTimeout(function(){
		  $('button[type=submit]').click();
		}, 300);
      	
    });

});
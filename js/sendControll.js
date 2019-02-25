$(document).ready(function() {
	
	var defaultHost = "localhost";
	var defaultPort = "8180";
	
	var defaultStats = "[not available]";

	// verify with is true or false to populate the checkbox
	if (window.localStorage['AutoEnable'] == undefined || window.localStorage['AutoEnable'][0] == "f") {
		document.getElementById('proxyAutoEnable').checked = false;
	} else {
		document.getElementById('proxyAutoEnable').checked = true;
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
	/*
	if (localStorage.getItem('AutoEnable') == null) {
		localStorage.setItem('AutoEnable', false);
		document.getElementById('proxyAutoEnable').checked = false;
	}
	*/
	
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
	console.log("proxy Auto Enable ==> " + localStorage.getItem('AutoEnable'));
	
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
		document.getElementById('proxyAutoEnable').checked = false;
		localStorage.setItem('AutoEnable', false);
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

	// catch auto enable change so we can store it to localStorage
	$("#proxyAutoEnable").click(function() {
		localStorage.setItem('AutoEnable', document.getElementById('proxyAutoEnable').checked);
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

	var flag = 2
	$("#settingsConfig").click(function(){

		if(flag == 2){
			$("#proxyHost").show();

			// make the fild able to use
			document.getElementById('proxyAutoEnable').disabled = false;
			document.getElementById('proxyHostHttp').disabled = false;
			document.getElementById('proxyPortHttp').disabled = false;
			
			flag = 1;
		}else{
			$("#proxyHost").hide();
			flag = 2;
		}
	});

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
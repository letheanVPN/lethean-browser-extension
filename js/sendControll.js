$(document).ready(function() {
	
	if(window.localStorage['proxyConfig'] == undefined || window.localStorage['proxyConfig'][20] == "s") {
		$("#system").attr("hidden", "hidden");
		$("#fixed_servers").removeAttr("hidden");
		$(".proxyFailMsg").removeClass('visible');
		$(".proxyFailMsg").addClass('nonDisplay');
		$("#settingsConfig").removeAttr("hidden");
		document.getElementById('proxyHostHttp').value = "localhost";
        document.getElementById('proxyPortHttp').value = "6666"
	}
	else{
		$("#fixed_servers").attr("hidden", "hidden");
		$("#system").removeAttr("hidden");
		$("#settingsConfig").attr("hidden", "hidden");
	}

	$('input[id=proxyTypeSystem]').click(function() {
		$("#system").attr("hidden", "hidden");
		$("#fixed_servers").removeAttr("hidden");
		$(".proxyFailMsg").removeClass('visible');
		$(".proxyFailMsg").addClass('nonDisplay');
		$("#settingsConfig").removeAttr("hidden");
		document.getElementById('proxyHostHttp').value = "localhost";
        document.getElementById('proxyPortHttp').value = "6666"
	});
	
	$('input[id=proxyTypeManual]').click(function() {
		$("#fixed_servers").attr("hidden", "hidden");
		$("#system").removeAttr("hidden");
		$("#settingsConfig").attr("hidden", "hidden");
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

	// make following action fire when radio button changes
    $('input[type=radio]').click(function(){
    	setTimeout(function(){
		  $('input[type=submit]').click();
		}, 300);
      	
    });

});
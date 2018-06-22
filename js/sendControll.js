$(document).ready(function() {

    // make following action fire when radio button changes
    $('input[type=radio]').change(function(){
      // find the submit button and click it on the previous action
      $('input[type=submit]').click()
    });

	$('input[id=proxyTypeSystem]').click(function(){
		$("#system").hide();
		$("#fixed_servers").show();
		$(".proxyFailMsg").removeClass('visible');
		$(".proxyFailMsg").addClass('nonDisplay');
		$("#settingsConfig").show();
	});
	$('input[id=proxyTypeManual]').click(function(){
		$("#fixed_servers").hide();
		$("#system").show();
		$("#settingsConfig").hide();
	});

	flag = 2
	$("#settingsConfig").click(function(){
		if(flag == 2){
			$("#proxyHost").show();
			flag = 1;
		}else{
			$("#proxyHost").hide();
			flag = 2;
		}
	})
});


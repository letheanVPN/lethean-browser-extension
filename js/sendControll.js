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
	});
	$('input[id=proxyTypeManual]').click(function(){
		$("#fixed_servers").hide();
		$("#system").show();
	});
});



	$(document).ready(function() {
    // make following action fire when radio button changes
    $('input[type=radio]').change(function(){
      // find the submit button and click it on the previous action
      $('input[type=submit]').click()
    });
	});


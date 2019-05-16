describe('Protractor Synchronization steps',function(){
	it('Open NonAngular js website Sync',function(){
		
		//This will hit url on browser(chrome by default)
		browser.waitForAngularEnabled(false); //This command is for nonAngular websites
		
		browser.manage().window().maximize();
		
		browser.get("http://www.itgeared.com/demo/1506-ajax-loading.html");
		
		element(by.css("a[href*='loadAjax']")).click();
		
		//we have to define expected conditions first
		var EC = protractor.ExpectedConditions;
		
		browser.wait(EC.invisibilityOf(element(by.id("loader"))), 8000);
		element(by.id("results")).getText().then(function(text)
				{
					console.log(text);
				})
		
	})
})
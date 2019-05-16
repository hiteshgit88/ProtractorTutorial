describe('Protractor Alert steps',function(){
	it('Open NonAngular js website Alerts',function(){
		
		//This will hit url on browser(chrome by default)
		browser.waitForAngularEnabled(false); //This command is for nonAngular websites
		
		browser.manage().window().maximize();
		
		browser.get("http://qaclickacademy.com/practice.php");
		browser.switchTo().frame("courses-iframe");
		element(by.css("a[href*='sign_in']")).getText().then(function(text)
		{
			console.log("The url name is " + text);
		})
		
		
	})
})
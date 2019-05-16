describe('Protractor Alert steps',function(){
	it('Open NonAngular js website Alerts',function(){
		
		//This will hit url on browser(chrome by default)
		browser.waitForAngularEnabled(false); //This command is for nonAngular websites
		browser.get("http://qaclickacademy.com/practice.php");
		
		element(by.id("confirmbtn")).click();
		
		browser.switchTo().alert().accept().then(function()
				{
					browser.sleep(5000);
				})
		
		
		
	})
})
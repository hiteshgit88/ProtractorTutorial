describe('Protractor Alert steps',function(){
	it('Open NonAngular js website Alerts',function(){
		
		//This will hit url on browser(chrome by default)
		browser.manage().window().maximize();
		browser.get("http://qaclickacademy.github.io/protocommerce/");
		
		element(by.name("name")).sendKeys("Mystudents");
		element(by.css("input[name='email']")).sendKeys("mystudents@gmail.com");
		element(by.id("exampleInputPassword1")).sendKeys("password2");
		element(by.css("input[type='checkbox']")).click();
		element(by.cssContainingText("[id='exampleFormControlSelect1'] option","Female")).click();
		element.all(by.name("inlineRadioOptions")).first().click();
		element(by.buttonText("Submit")).click().then(function()
				{
					element(by.css("div[class*='success']")).getText().then(function(text)
							{
								console.log(text);
							})
				})
		
				
	})
}) 
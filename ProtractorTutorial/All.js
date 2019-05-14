describe('Protractor Element demo',function() {  


it('Locators',function() {
browser.get('http://juliemr.github.io/protractor-demo/');
//repeater ,  chain locators, And css for identical tags
element(by.model("first")).sendKeys("3");
element(by.model("second")).sendKeys("5");
element(by.id("gobutton")).click();

element(by.model("first")).sendKeys("3");
element(by.model("second")).sendKeys("7");
element(by.id("gobutton")).click();

element(by.model("first")).sendKeys("3");
element(by.model("second")).sendKeys("8");
element(by.id("gobutton")).click();

element.all(by.repeater("result in memory")).count().then(function(text)
{

console.log(text);

})

element.all(by.repeater("result in memory")).each(function(item)
{

item.element(by.repeater("result in memory")).element(by.css("td:nth-child(3)")).getText().then(function(text)
{

console.log(text);
})

})

})

})